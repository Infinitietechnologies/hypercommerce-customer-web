import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getCookie } from "@/lib/cookies";
import { supportService } from "@/services/support";
import type {
  SupportConnectionMode,
  SupportMessage,
  SupportSession,
  SupportThreadPayload,
  SupportTopic,
} from "@/types/support";

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
};

const normalizePayload = (payload: SupportThreadPayload): SupportThreadPayload => ({
  ...payload,
  thread: {
    ...payload.thread,
    sessions: [...payload.thread.sessions]
      .sort((left, right) => left.id - right.id)
      .map((session) => ({
        ...session,
        messages: [...session.messages].sort((left, right) => left.id - right.id),
        calls: [...session.calls].sort((left, right) => left.id - right.id),
      })),
  },
});

type SupportTypingEvent = {
  role: "admin" | "customer";
  typing: boolean;
};

type SupportPresenceChannel = {
  subscribed: (callback: () => void) => SupportPresenceChannel;
};

type SupportPrivateChannel = {
  whisper: (event: string, data: SupportTypingEvent) => SupportPrivateChannel;
};

export const useSupportChat = (initialData: SupportThreadPayload | null) => {
  const [payload, setPayload] = useState<SupportThreadPayload | null>(() => initialData ? normalizePayload(initialData) : null);
  const [topics, setTopics] = useState<SupportTopic[]>([]);
  const [connection, setConnection] = useState<SupportConnectionMode>("polling");
  const [loading, setLoading] = useState(!initialData);
  const [sending, setSending] = useState(false);
  const mutationInFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const socketLive = useRef(false);
  const polling = useRef(false);
  const payloadRef = useRef(payload);
  const presenceChannel = useRef<SupportPresenceChannel | null>(null);
  const privateThreadChannel = useRef<SupportPrivateChannel | null>(null);
  const localTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localTyping = useRef(false);
  const remoteTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingOlderRef = useRef(false);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  const activeSession = useMemo(
    () => payload?.thread.sessions.find((session) => session.id === payload.thread.active_ticket_id) || null,
    [payload],
  );
  const activeSessionSlug = activeSession?.slug;
  const realtimeDriver = payload?.realtime.driver;
  const realtimeKey = payload?.realtime.key;
  const realtimeHost = payload?.realtime.host;
  const realtimePort = payload?.realtime.port;
  const realtimeScheme = payload?.realtime.scheme;
  const realtimeCluster = payload?.realtime.cluster;
  const realtimeAuthEndpoint = payload?.realtime.auth_endpoint;
  const threadUuid = payload?.thread.uuid;
  const pollingEnabled = payload?.polling_enabled ?? true;

  const messageCursor = useCallback(() => {
    const messages = payloadRef.current?.thread.sessions.flatMap((session) => session.messages) || [];
    return Math.max(0, ...messages.map((message) => message.id));
  }, []);

  const callCursor = useCallback(() => {
    const calls = payloadRef.current?.thread.sessions.flatMap((session) => session.calls) || [];
    return Math.max(0, ...calls.map((call) => call.id));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await supportService.getThread();
      setPayload(normalizePayload(next));
      setError(null);
      return next;
    } catch (caught) {
      setError(getErrorMessage(caught));
      throw caught;
    } finally {
      setLoading(false);
    }
  }, []);

  const mergeMessages = useCallback((messages: SupportMessage[]) => {
    if (!messages.length) return;
    setPayload((current) => {
      if (!current) return current;
      const ids = new Set(current.thread.sessions.flatMap((session) => session.messages.map((message) => message.id)));
      const nextSessions = current.thread.sessions.map((session) => ({
        ...session,
        messages: [
          ...session.messages,
          ...messages.filter((message) => message.session_id === session.id && !ids.has(message.id)),
        ].sort((a, b) => a.id - b.id),
      }));
      return {...current, thread: {...current.thread, sessions: nextSessions}};
    });
  }, []);

  const catchUp = useCallback(async () => {
    if (polling.current || !payloadRef.current) return;
    polling.current = true;
    try {
      const updates = await supportService.getUpdates(messageCursor(), callCursor());
      mergeMessages(updates.messages);
      if (updates.active_ticket_id !== payloadRef.current.thread.active_ticket_id || updates.calls.length) {
        await refresh();
      }
      if (!socketLive.current) setConnection("polling");
    } catch (caught) {
      setConnection(navigator.onLine && pollingEnabled ? "polling" : "offline");
      setError(getErrorMessage(caught));
    } finally {
      polling.current = false;
    }
  }, [callCursor, mergeMessages, messageCursor, pollingEnabled, refresh]);

  const announceTyping = useCallback((typing: boolean) => {
    if (localTypingTimer.current) clearTimeout(localTypingTimer.current);
    if (activeSessionSlug && localTyping.current !== typing) {
      localTyping.current = typing;
      privateThreadChannel.current?.whisper("typing", {role: "customer", typing});
      void supportService.typing(activeSessionSlug, typing).catch(() => undefined);
    }
    if (typing) {
      localTypingTimer.current = setTimeout(() => {
        localTyping.current = false;
        if (activeSessionSlug) {
          privateThreadChannel.current?.whisper("typing", {role: "customer", typing: false});
          void supportService.typing(activeSessionSlug, false).catch(() => undefined);
        }
      }, 1400);
    }
  }, [activeSessionSlug]);

  const loadOlder = useCallback(async (beforePrepend?: () => void) => {
    const pagination = payloadRef.current?.thread.message_pagination;
    if (!pagination?.has_more || !pagination.oldest_message_id || loadingOlderRef.current) return;
    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const page = await supportService.getOlderMessages(pagination.oldest_message_id);
      beforePrepend?.();
      setPayload((current) => {
        if (!current) return current;
        const ids = new Set(current.thread.sessions.flatMap((session) => session.messages.map((message) => message.id)));
        return {
          ...current,
          thread: {
            ...current.thread,
            message_pagination: {
              has_more: page.has_more,
              oldest_message_id: page.oldest_message_id,
            },
            sessions: current.thread.sessions.map((session) => ({
              ...session,
              messages: [
                ...page.messages.filter((message) => message.session_id === session.id && !ids.has(message.id)),
                ...session.messages,
              ].sort((left, right) => left.id - right.id),
            })),
          },
        };
      });
    } catch (caught) {
      setError(getErrorMessage(caught));
      throw caught;
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, []);

  useEffect(() => {
    if (!payload) refresh().catch(() => undefined);
    supportService.getTopics().then(setTopics).catch((caught) => setError(getErrorMessage(caught)));
  }, [payload, refresh]);

  useEffect(() => {
    if (!threadUuid || !realtimeKey || !realtimeDriver || !realtimeAuthEndpoint || !["reverb", "pusher"].includes(realtimeDriver)) {
      setConnection(pollingEnabled ? "polling" : "offline");
      return;
    }

    let echo: { leave: (channel: string) => void; disconnect: () => void } | null = null;
    let disposed = false;
    void Promise.all([import("laravel-echo"), import("pusher-js")]).then(([echoModule, pusherModule]) => {
      if (disposed) return;
      const Echo = echoModule.default;
      const Pusher = pusherModule.default;
      const token = String(getCookie("access_token") || "");
      const authorizationHeaders = {Authorization: `Bearer ${token}`, Accept: "application/json"};
      const instance = new Echo({
        broadcaster: realtimeDriver === "reverb" ? "reverb" : "pusher",
        Pusher,
        key: realtimeKey,
        cluster: realtimeCluster || "mt1",
        wsHost: realtimeHost || undefined,
        wsPort: realtimePort || 80,
        wssPort: realtimePort || 443,
        forceTLS: realtimeScheme === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: realtimeAuthEndpoint,
        auth: {headers: authorizationHeaders},
        channelAuthorization: {
          endpoint: realtimeAuthEndpoint,
          transport: "ajax",
          headers: authorizationHeaders,
        },
      });
      echo = instance;
      const threadChannel = instance.private(`support.thread.${threadUuid}`);
      privateThreadChannel.current = threadChannel as SupportPrivateChannel;
      threadChannel
        .subscribed(() => {
          socketLive.current = true;
          setConnection("live");
          void catchUp();
        })
        .error(() => {
          socketLive.current = false;
          setConnection(pollingEnabled ? "polling" : "offline");
        })
        .listen(".support.activity", (activity: {message_id?: number | null}) => {
          void (activity.message_id ? catchUp() : refresh());
        })
        .listen(".support.typing", (activity: SupportTypingEvent) => {
          if (activity.role !== "admin") return;
          if (remoteTypingTimer.current) clearTimeout(remoteTypingTimer.current);
          setRemoteTyping(activity.typing);
          if (activity.typing) remoteTypingTimer.current = setTimeout(() => setRemoteTyping(false), 1800);
        })
        .listenForWhisper("typing", (activity: SupportTypingEvent) => {
          if (activity.role !== "admin") return;
          if (remoteTypingTimer.current) clearTimeout(remoteTypingTimer.current);
          setRemoteTyping(activity.typing);
          if (activity.typing) remoteTypingTimer.current = setTimeout(() => setRemoteTyping(false), 1800);
        });
      const presence = instance.join(`support.presence.thread.${threadUuid}`) as SupportPresenceChannel;
      presenceChannel.current = presence;
      instance.connector.pusher.connection.bind("disconnected", () => {
        socketLive.current = false;
        setConnection(pollingEnabled ? "polling" : "offline");
      });
      instance.connector.pusher.connection.bind("unavailable", () => {
        socketLive.current = false;
        setConnection(navigator.onLine && pollingEnabled ? "polling" : "offline");
      });
    }).catch(() => {
      socketLive.current = false;
      setConnection(pollingEnabled ? "polling" : "offline");
    });

    return () => {
      disposed = true;
      socketLive.current = false;
      announceTyping(false);
      presenceChannel.current = null;
      if (remoteTypingTimer.current) clearTimeout(remoteTypingTimer.current);
      setRemoteTyping(false);
      echo?.leave(`support.thread.${threadUuid}`);
      echo?.leave(`support.presence.thread.${threadUuid}`);
      echo?.disconnect();
      privateThreadChannel.current = null;
    };
  }, [announceTyping, catchUp, pollingEnabled, realtimeAuthEndpoint, realtimeCluster, realtimeDriver, realtimeHost, realtimeKey, realtimePort, realtimeScheme, refresh, threadUuid]);

  useEffect(() => {
    if (!activeSession) return;
    void supportService.markRead(activeSession.slug, messageCursor()).catch(() => undefined);
  }, [activeSession, messageCursor, payload?.thread.last_message_at]);

  useEffect(() => {
    const interval = pollingEnabled ? window.setInterval(() => {
      if (!socketLive.current && !document.hidden && navigator.onLine) void catchUp();
    }, Math.max(15000, payload?.poll_interval_ms || 15000)) : null;
    const sync = () => {
      if (!socketLive.current && pollingEnabled) void refresh();
    };
    const visible = () => {
      if (!document.hidden) sync();
    };
    const offline = () => setConnection("offline");
    window.addEventListener("online", sync);
    window.addEventListener("offline", offline);
    document.addEventListener("visibilitychange", visible);
    return () => {
      if (interval !== null) window.clearInterval(interval);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", offline);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [catchUp, payload?.poll_interval_ms, pollingEnabled, refresh]);

  const mutate = useCallback((operation: () => Promise<unknown>) => {
    if (mutationInFlight.current) return Promise.reject(new Error("Support action already in progress"));
    mutationInFlight.current = true;
    const task = (async () => {
      setSending(true);
      try {
        await operation();
        await refresh().catch(() => undefined);
      } finally {
        setSending(false);
        mutationInFlight.current = false;
      }
    })();
    return task;
  }, [refresh]);

  return {
    payload,
    topics,
    activeSession,
    connection,
    loading,
    sending,
    error,
    remoteTyping,
    loadingOlder,
    hasOlder: Boolean(payload?.thread.message_pagination?.has_more),
    loadOlder,
    announceTyping,
    refresh,
    startSession: (input: Parameters<typeof supportService.startSession>[0]) => mutate(() => supportService.startSession(input)),
    sendMessage: (session: SupportSession, message: string, attachments: File[]) => mutate(() => supportService.sendMessage(session.slug, message, attachments)),
    resolve: (session: SupportSession) => mutate(() => supportService.resolve(session.slug)),
    requestCallback: (session: SupportSession) => mutate(() => supportService.requestCallback(session.slug)),
    rate: (session: SupportSession, score: number, feedback?: string) => mutate(() => supportService.rate(session.slug, score, feedback)),
  };
};
