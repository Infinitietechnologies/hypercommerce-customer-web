import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import Image from "next/image";
import clsx from "clsx";
import Lightbox from "yet-another-react-lightbox";
import Download from "yet-another-react-lightbox/plugins/download";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import SupportDropZone from "@/features/support/components/SupportDropZone";
import { supportErrorMessage } from "@/features/support/supportError";

import {
  Button,
  Card,
  CardBody,
  ErrorState,
  Sheet,
  Skeleton,
  Textarea,
  toastError,
  toastSuccess,
} from "@/components/ui";
import { supportService } from "@/services/support";
import type {
  SupportAttachment,
  SupportMessage,
  SupportOrder,
  SupportSession,
  SupportThreadPayload,
} from "@/types/support";
import { useSupportChat } from "@/features/support/hooks/useSupportChat";

type Props = { initialData: SupportThreadPayload | null };

const formatTime = (value: string) => new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
}).format(new Date(value));

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const PrivateAttachment = ({ attachment }: { attachment: SupportAttachment }) => {
  const { t } = useTranslation();
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const isImage = attachment.mime_type.startsWith("image/");
  const isPdf = attachment.mime_type === "application/pdf";

  useEffect(() => {
    if (!isImage) return;
    let active = true;
    supportService.downloadAttachment(attachment.download_url).then((blob) => {
      if (active) setSource(URL.createObjectURL(blob));
    }).catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [attachment.download_url, isImage]);

  useEffect(() => () => {
    if (source) URL.revokeObjectURL(source);
  }, [source]);

  const preview = async () => {
    if (source) {
      setPreviewOpen(true);
      return;
    }
    setPreviewLoading(true);
    try {
      const blob = await supportService.downloadAttachment(attachment.download_url);
      setSource(URL.createObjectURL(blob));
      setPreviewOpen(true);
      setFailed(false);
    } catch {
      setFailed(true);
      toastError(t("supportChat.previewFailed"));
    } finally {
      setPreviewLoading(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      const blob = await supportService.downloadAttachment(attachment.download_url);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      setFailed(true);
      toastError(t("supportChat.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {isImage ? (
        <div className="mt-2 inline-flex max-w-full flex-col items-start gap-1.5">
          {source ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group relative block cursor-zoom-in overflow-hidden rounded-lg border border-divider bg-content2"
              aria-label={t("supportChat.previewAttachment", {name: attachment.name})}
            >
              <Image unoptimized src={source} alt={attachment.name} width={128} height={96} className="h-24 w-32 object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                <Icon icon="solar:magnifer-zoom-in-linear" width={22} />
              </span>
            </button>
          ) : (
            <button type="button" onClick={preview} disabled={!failed || previewLoading} className="flex h-24 w-32 flex-col items-center justify-center gap-1 rounded-lg bg-content2 px-2 text-center text-xs text-default-500 disabled:cursor-wait" aria-label={t("supportChat.previewAttachment", {name: attachment.name})}>
              {failed ? <><span className="max-w-full truncate">{attachment.name}</span><span className="text-primary">{t("retry")}</span></> : t("supportChat.loadingImage")}
            </button>
          )}
          <button type="button" onClick={download} disabled={downloading} className="inline-flex items-center gap-1 text-xs font-semibold text-default-500 hover:text-primary disabled:opacity-50">
            <Icon icon={downloading ? "solar:refresh-circle-linear" : "solar:download-linear"} width={15} className={downloading ? "animate-spin" : ""} />
            {t("supportChat.downloadAttachment")}
          </button>
        </div>
      ) : (
        <div className="mt-2 flex max-w-full items-center gap-1.5">
          <button
            type="button"
            onClick={preview}
            disabled={!isPdf || previewLoading}
            aria-label={isPdf ? t("supportChat.previewAttachment", {name: attachment.name}) : undefined}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-divider bg-content1 px-3 py-2 text-left text-xs font-semibold hover:bg-content2 disabled:cursor-default"
          >
            <Icon icon={previewLoading ? "solar:refresh-circle-linear" : "solar:file-text-linear"} width={19} className={previewLoading ? "animate-spin" : ""} />
            <span className="max-w-44 truncate">{attachment.name}</span>
            <span className="shrink-0 text-default-400">{formatBytes(attachment.size)}</span>
            {isPdf ? <Icon icon="solar:eye-linear" width={17} className="shrink-0" /> : null}
          </button>
          <button type="button" onClick={download} disabled={downloading} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-divider bg-content1 text-default-500 hover:border-primary hover:text-primary disabled:opacity-50" aria-label={t("supportChat.downloadNamedAttachment", {name: attachment.name})}>
            <Icon icon={downloading ? "solar:refresh-circle-linear" : "solar:download-linear"} width={18} className={downloading ? "animate-spin" : ""} />
          </button>
        </div>
      )}

      {isImage && source ? (
        <Lightbox
          open={previewOpen}
          close={() => setPreviewOpen(false)}
          slides={[{src: source, alt: attachment.name, download: {url: source, filename: attachment.name}}]}
          plugins={[Download, Zoom]}
          zoom={{ scrollToZoom: true, maxZoomPixelRatio: 5 }}
          render={{buttonPrev: () => null, buttonNext: () => null}}
          labels={{Download: t("supportChat.downloadAttachment"), "Zoom in": t("supportChat.zoomIn"), "Zoom out": t("supportChat.zoomOut")}}
        />
      ) : null}

      {isPdf && source ? (
        <Sheet
          isOpen={previewOpen}
          onOpenChange={setPreviewOpen}
          size="5xl"
          title={<span className="truncate">{attachment.name}</span>}
          classNames={{base: "w-full bg-content1", body: "p-0"}}
          footer={(
            <Button className="w-full" variant="bordered" onPress={download} isLoading={downloading}>
              <Icon icon="solar:download-linear" width={17} />
              {t("supportChat.downloadAttachment")}
            </Button>
          )}
        >
          <iframe src={source} title={attachment.name} className="h-full min-h-96 w-full border-0" />
        </Sheet>
      ) : null}
    </>
  );
};

const MessageBubble = ({ message }: { message: SupportMessage }) => {
  const { t } = useTranslation();
  if (message.sender_role === "system" && message.type !== "auto_reply") {
    const success = message.type === "closure";
    const normalizedText = message.text.toLowerCase();
    const icon = success
      ? "solar:check-circle-linear"
      : normalizedText.includes("call") || normalizedText.includes("callback")
        ? "solar:phone-calling-linear"
        : normalizedText.includes("assign")
          ? "solar:user-check-linear"
          : "solar:info-circle-linear";
    return (
      <div className={clsx("mx-auto my-2 flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 px-2 text-center text-xs leading-5", success ? "text-success-700" : "text-default-500")} role="status">
        <span className={clsx("grid h-5 w-5 shrink-0 place-items-center rounded-full", success ? "bg-success-50" : "bg-content2")}>
          <Icon icon={icon} width={14} />
        </span>
        <span className="font-medium">{message.text}</span>
        <time className="shrink-0 opacity-60">{formatTime(message.created_at)}</time>
      </div>
    );
  }

  const mine = message.sender_role === "user";
  return (
    <div className={`mb-4 flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-divider bg-content1 text-foreground"}`}>
        <div className="mb-1 flex items-center justify-between gap-4 text-[11px] opacity-70">
          <span>{mine ? t("supportChat.you") : message.sender_name || t("supportChat.supportAgent")}</span>
          <time>{formatTime(message.created_at)}</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
        {message.attachments.map((attachment) => <PrivateAttachment key={attachment.id} attachment={attachment} />)}
      </div>
    </div>
  );
};

const SessionTimeline = ({ sessions }: { sessions: SupportSession[] }) => {
  const { t } = useTranslation();

  return (
    <>
      {[...sessions].sort((left, right) => left.id - right.id).map((session) => (
        <section key={session.id} aria-label={session.slug}>
          <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-default-400">
            <span className="h-px flex-1 bg-divider" />
            <span>{session.slug} · {session.topic?.title || t("supportChat.supportAgent")}</span>
            <span className="h-px flex-1 bg-divider" />
          </div>
          {[...session.messages].sort((left, right) => left.id - right.id).map((message) => <MessageBubble key={message.id} message={message} />)}
        </section>
      ))}
    </>
  );
};

const OrderChoice = ({ order, selected, onSelect }: { order: SupportOrder; selected: boolean; onSelect: () => void }) => (
  <button type="button" onClick={onSelect} className={`w-full rounded-xl border p-3 text-start transition-colors ${selected ? "border-primary bg-primary-50" : "border-divider bg-content1 hover:bg-content2"}`}>
    <div className="flex items-center justify-between gap-3">
      <strong>{order.number}</strong>
      <span className="rounded-full bg-success-50 px-2 py-1 text-[11px] font-semibold text-success-700">{order.status}</span>
    </div>
    <div className="mt-1 text-xs text-default-500">{formatTime(order.created_at)} · {order.currency_code} {order.total}</div>
  </button>
);

export const SupportChat = ({ initialData }: Props) => {
  const { t } = useTranslation();
  const router = useRouter();
  const chat = useSupportChat(initialData);
  const requestedOrder = Number(router.query.order);
  const [selectedOrder, setSelectedOrder] = useState<number | null | undefined>(() => {
    return requestedOrder > 0 ? requestedOrder : undefined;
  });
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [ratingScore, setRatingScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showOlderOrders, setShowOlderOrders] = useState(false);
  const [startFlowOpen, setStartFlowOpen] = useState(() => requestedOrder > 0 || Boolean(initialData && !initialData.thread.sessions.length));
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const latestMessageIdRef = useRef(0);

  const visibleTopics = useMemo(() => chat.topics.filter((topic) => {
    if (topic.context === "both") return true;
    return selectedOrder ? topic.context === "order" : topic.context === "general";
  }), [chat.topics, selectedOrder]);
  const selectedTopicDetails = useMemo(
    () => chat.topics.find((topic) => topic.id === selectedTopic) ?? null,
    [chat.topics, selectedTopic],
  );
  const sessionCount = chat.payload?.thread.sessions.length;
  const lastSession = chat.payload?.thread.sessions.at(-1);
  const supportFlowOpen = startFlowOpen || sessionCount === 0;

  useEffect(() => {
    const latestMessageId = Math.max(0, ...(chat.payload?.thread.sessions.flatMap((session) => session.messages.map((item) => item.id)) || []));
    if (latestMessageId > latestMessageIdRef.current) {
      latestMessageIdRef.current = latestMessageId;
      timelineRef.current?.scrollTo({top: timelineRef.current.scrollHeight});
    }
  }, [chat.payload?.thread.sessions]);

  useEffect(() => {
    if (chat.remoteTyping) timelineRef.current?.scrollTo({top: timelineRef.current.scrollHeight, behavior: "smooth"});
  }, [chat.remoteTyping]);

  const loadOlderMessages = async () => {
    const timeline = timelineRef.current;
    if (!timeline || !chat.hasOlder || chat.loadingOlder) return;
    const previousHeight = timeline.scrollHeight;
    try {
      await chat.loadOlder();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (timelineRef.current) timelineRef.current.scrollTop = timelineRef.current.scrollHeight - previousHeight;
      }));
    } catch {
      toastError(t("supportChat.actionFailed"));
    }
  };

  const validateFiles = (files: File[]) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (chat.sending) return;
    if (files.length + attachments.length > 5 || files.some((file) => !allowed.includes(file.type) || file.size > 10 * 1024 * 1024)) {
      toastError(t("supportChat.attachmentError"));
      return;
    }
    setAttachments((current) => [...current, ...files]);
  };

  const startSession = async () => {
    if (!selectedTopic || (!message.trim() && !attachments.length)) return;
    try {
      await chat.startSession({
        topicId: selectedTopic,
        orderId: selectedOrder || undefined,
        message: message.trim(),
        attachments,
      });
      setMessage("");
      setAttachments([]);
      setSelectedOrder(undefined);
      setSelectedTopic(null);
      setStartFlowOpen(false);
      toastSuccess(t("supportChat.started"));
    } catch (error) {
      toastError(supportErrorMessage(error, t("supportChat.actionFailed"), seconds => t("supportChat.rateLimited", {seconds})));
    }
  };

  const sendMessage = async () => {
    if (!chat.activeSession || (!message.trim() && !attachments.length)) return;
    try {
      await chat.sendMessage(chat.activeSession, message.trim(), attachments);
      chat.announceTyping(false);
      setMessage("");
      setAttachments([]);
    } catch (error) {
      toastError(supportErrorMessage(error, t("supportChat.sendFailed"), seconds => t("supportChat.rateLimited", {seconds})));
    }
  };

  const resolveConversation = async () => {
    if (!chat.activeSession) return;
    try {
      await chat.resolve(chat.activeSession);
      setResolveConfirmOpen(false);
      setSelectedOrder(undefined);
      setSelectedTopic(null);
      setStartFlowOpen(false);
      toastSuccess(t("supportChat.resolved"));
    } catch {
      toastError(t("supportChat.actionFailed"));
    }
  };

  const submitRating = async () => {
    if (!lastSession || !ratingScore) return;
    try {
      await chat.rate(lastSession, ratingScore, feedback.trim() || undefined);
      setRatingScore(null);
      setFeedback("");
      toastSuccess(t("supportChat.thanks"));
    } catch {
      toastError(t("supportChat.actionFailed"));
    }
  };

  const openNewSupportFlow = () => {
    setSelectedOrder(undefined);
    setSelectedTopic(null);
    setMessage("");
    setAttachments([]);
    setShowOlderOrders(false);
    setStartFlowOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      timelineRef.current?.scrollTo({top: timelineRef.current.scrollHeight, behavior: "smooth"});
    }));
  };

  if (chat.loading) {
    return <Card className="min-h-[640px] p-5"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="mt-6 h-[480px] w-full rounded-xl" /></Card>;
  }
  if (!chat.payload) {
    return <ErrorState title={t("supportChat.loadFailed")} description={chat.error || undefined} retryLabel={t("common.retry", "Retry")} onRetry={chat.refresh} />;
  }

  const modeClasses = chat.connection === "live"
    ? "bg-success-50 text-success-700"
    : chat.connection === "offline"
      ? "bg-danger-50 text-danger-700"
      : "bg-warning-50 text-warning-700";

  return (
    <>
      <Card className="h-[calc(100dvh-10rem)] min-h-[620px] overflow-hidden">
      <SupportDropZone enabled={!chat.sending && Boolean(chat.activeSession || (supportFlowOpen && selectedTopic))} onFiles={validateFiles}>
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center gap-3 border-b border-divider bg-content1 px-4 py-3 sm:flex-nowrap sm:px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Icon icon="solar:chat-round-dots-linear" width={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold">{t("supportChat.title")}</h1>
            <p className="truncate text-xs text-default-500">{chat.activeSession ? `${chat.activeSession.slug} · ${chat.activeSession.topic?.title || ""}` : t("supportChat.assistant")}</p>
          </div>
          <span className={clsx("inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-divider px-2.5 text-xs font-semibold", modeClasses)}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {t(`supportChat.connection.${chat.connection}`)}
          </span>
          {chat.activeSession ? (
            <div className="order-last flex w-full items-center gap-2 sm:order-none sm:w-auto">
              <Button size="xs" variant="bordered" className="h-9 flex-1 rounded-xl border-divider bg-content1 px-3 sm:flex-none" onPress={() => chat.requestCallback(chat.activeSession!).then(() => toastSuccess(t("supportChat.callbackRequested"))).catch(error => toastError(supportErrorMessage(error, t("supportChat.actionFailed"), seconds => t("supportChat.rateLimited", {seconds}))))} isLoading={chat.sending}>
                <Icon icon="solar:phone-calling-linear" width={17} />
                <span>{t("supportChat.callback")}</span>
              </Button>
              <Button size="xs" color="success" variant="flat" className="h-9 flex-1 rounded-xl px-3 sm:flex-none" onPress={() => setResolveConfirmOpen(true)} isLoading={chat.sending}>
                <Icon icon="solar:check-circle-linear" width={17} />
                <span>{t("supportChat.resolve")}</span>
              </Button>
            </div>
          ) : null}
        </header>

        <div
          ref={timelineRef}
          className="slim-scrollbar flex-1 overflow-y-auto bg-content2/40 px-3 py-4 sm:px-6"
          onScroll={(event) => { if (event.currentTarget.scrollTop <= 64) void loadOlderMessages(); }}
        >
          {chat.hasOlder ? (
            <div className="mb-3 text-center">
              <Button size="sm" variant="light" onPress={loadOlderMessages} isLoading={chat.loadingOlder}>
                <Icon icon="solar:history-linear" width={17} />
                {t("supportChat.loadOlder")}
              </Button>
            </div>
          ) : null}
          {chat.payload.thread.sessions.length ? <SessionTimeline sessions={chat.payload.thread.sessions} /> : (
            <div className="mx-auto max-w-lg py-8 text-center">
              <Icon icon="solar:help-outline" width={44} className="mx-auto text-primary-500" />
              <h2 className="mt-3 text-lg font-bold">{t("supportChat.welcome")}</h2>
              <p className="mt-1 text-sm text-default-500">{t("supportChat.welcomeDescription")}</p>
            </div>
          )}

          {chat.activeSession && !chat.activeSession.assignee ? (
            <div className="mx-auto my-4 flex max-w-lg items-start gap-2 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700" role="status">
              <Icon icon="solar:headphones-round-sound-linear" width={20} className="mt-0.5 shrink-0" />
              <span>{t("supportChat.executiveConnecting")}</span>
            </div>
          ) : null}

          {chat.remoteTyping ? (
            <div className="mb-4 flex justify-start" aria-live="polite">
              <div className="rounded-2xl rounded-bl-sm border border-divider bg-content1 px-4 py-3 text-sm text-default-500">
                {t("supportChat.typing")}
              </div>
            </div>
          ) : null}

          {!chat.activeSession && supportFlowOpen && selectedOrder === undefined ? (
            <Card className="mx-auto mt-5 max-w-xl">
              <CardBody className="gap-3 p-4">
                <h2 className="font-bold">{t("supportChat.selectOrder")}</h2>
                {chat.payload.recent_orders.slice(0, showOlderOrders ? 20 : 5).map((order) => <OrderChoice key={order.id} order={order} selected={false} onSelect={() => setSelectedOrder(order.id)} />)}
                {chat.payload.recent_orders.length > 5 && !showOlderOrders ? (
                  <Button variant="light" onPress={() => setShowOlderOrders(true)}>{t("supportChat.olderOrders")}</Button>
                ) : null}
                <Button variant="bordered" onPress={() => setSelectedOrder(null)}>{t("supportChat.generalHelp")}</Button>
              </CardBody>
            </Card>
          ) : null}

          {!chat.activeSession && supportFlowOpen && selectedOrder !== undefined && !selectedTopic ? (
            <Card className="mx-auto mt-5 max-w-xl">
              <CardBody className="gap-3 p-4">
                <div className="flex items-center gap-2">
                  <Button isIconOnly size="md" variant="light" onPress={() => setSelectedOrder(undefined)} aria-label={t("common.back", "Back")}><Icon icon="solar:arrow-left-linear" /></Button>
                  <h2 className="font-bold">{t("supportChat.selectTopic")}</h2>
                </div>
                {visibleTopics.map((topic) => (
                  <button key={topic.id} type="button" onClick={() => setSelectedTopic(topic.id)} className="rounded-xl border border-divider bg-content1 p-3 text-start hover:border-primary hover:bg-primary-50">
                    <div className="font-semibold">{topic.title}</div>
                    {topic.guidance ? <div className="mt-1 text-xs text-default-500">{topic.guidance}</div> : null}
                  </button>
                ))}
              </CardBody>
            </Card>
          ) : null}

          {!chat.activeSession && supportFlowOpen && selectedTopic ? (
            <Card className="mx-auto mt-5 max-w-xl">
              <CardBody className="gap-3 p-4">
                <h2 className="font-bold">{t("supportChat.describeIssue")}</h2>
                {selectedTopicDetails?.guidance ? (
                  <div className="rounded-xl bg-primary-50 p-3 text-sm text-primary-700">
                    <div className="flex gap-2">
                      <Icon icon="solar:info-circle-linear" width={18} className="mt-0.5 shrink-0" />
                      <span>{selectedTopicDetails.guidance}</span>
                    </div>
                  </div>
                ) : null}
                {selectedTopicDetails?.quick_replies.length ? (
                  <div className="slim-scrollbar flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible" role="group" aria-label={t("supportChat.quickReplies")}>
                    {selectedTopicDetails.quick_replies.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => setMessage(reply)}
                        aria-pressed={message === reply}
                        className={clsx(
                          "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                          message === reply
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-divider bg-content1 text-default-600 hover:border-primary hover:bg-primary-50 hover:text-primary",
                        )}
                      >
                        <Icon icon="solar:chat-round-dots-linear" width={16} />
                        <span className="whitespace-nowrap">{reply}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
                <Textarea value={message} onValueChange={setMessage} maxLength={4000} minRows={3} placeholder={t("supportChat.messagePlaceholder")} />
                <AttachmentPicker files={attachments} onFiles={validateFiles} onRemove={(index) => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
                <div className="flex gap-2">
                  <Button variant="light" onPress={() => setSelectedTopic(null)}>{t("common.back", "Back")}</Button>
                  <Button className="flex-1" onPress={startSession} isLoading={chat.sending} isDisabled={!message.trim() && !attachments.length}>{t("supportChat.startChat")}</Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {!chat.activeSession && lastSession?.rating === null ? (
            <Card className="mx-auto my-5 max-w-xl">
              <CardBody className="items-center gap-3 p-5 text-center">
                <h2 className="font-bold">{t("supportChat.rateAssistance")}</h2>
                <p className="text-xs text-default-500">{t("supportChat.ratingHint")}</p>
                <div className="flex gap-1" dir="ltr" role="group" aria-label={t("supportChat.rateAssistance")}>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      aria-pressed={ratingScore === score}
                      onClick={() => setRatingScore(score)}
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-full text-rating-star transition-colors hover:bg-warning-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                        score <= (ratingScore ?? 0) ? "bg-warning-50" : "bg-transparent",
                      )}
                      aria-label={t("supportChat.ratingStars", {count: score})}
                    >
                      <Icon icon={score <= (ratingScore ?? 0) ? "solar:star-bold" : "solar:star-linear"} width={26} />
                    </button>
                  ))}
                </div>
                <Textarea value={feedback} onValueChange={setFeedback} maxLength={2000} minRows={2} placeholder={t("supportChat.feedbackPlaceholder")} />
                <Button className="w-full" onPress={submitRating} isLoading={chat.sending} isDisabled={!ratingScore}>
                  {t("supportChat.submitRating")}
                </Button>
              </CardBody>
            </Card>
          ) : null}

          {!chat.activeSession && !supportFlowOpen && chat.payload.thread.sessions.length ? (
            <div className="mx-auto my-5 flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-divider bg-content1 p-4 shadow-sm">
              <div className="min-w-0">
                <div className="font-semibold">{t("supportChat.stillIssue")}</div>
                <div className="mt-1 text-xs text-default-500">{t("supportChat.startAnotherDescription")}</div>
              </div>
              <Button size="xs" className="h-9 shrink-0 rounded-xl px-3" onPress={openNewSupportFlow}>
                <Icon icon="solar:chat-round-dots-linear" width={17} />
                {t("supportChat.chatWithUs")}
              </Button>
            </div>
          ) : null}
        </div>

        {chat.activeSession ? (
          <footer className="border-t border-divider bg-content1 p-3 sm:p-4">
            <AttachmentPicker files={attachments} onFiles={validateFiles} onRemove={(index) => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} compact />
            <div className="flex items-end gap-2">
              <Textarea
                value={message}
                onValueChange={(value) => { setMessage(value); chat.announceTyping(Boolean(value.trim())); }}
                onBlur={() => chat.announceTyping(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    void sendMessage();
                  }
                }}
                maxLength={4000}
                minRows={1}
                maxRows={5}
                placeholder={t("supportChat.messagePlaceholder")}
                className="flex-1"
              />
              <Button isIconOnly onPress={sendMessage} isLoading={chat.sending} isDisabled={!message.trim() && !attachments.length} aria-label={t("supportChat.send")}>
                <Icon icon="solar:plain-2-bold" width={20} />
              </Button>
            </div>
          </footer>
        ) : null}
      </div>
      </SupportDropZone>
      </Card>
      <Sheet
        isOpen={resolveConfirmOpen}
        onOpenChange={setResolveConfirmOpen}
        title={t("supportChat.resolveConfirmTitle")}
        backdrop="blur"
        classNames={{base: "w-full bg-content1", body: "pb-2"}}
        footer={(
          <div className="flex w-full gap-2">
            <Button className="flex-1" variant="light" onPress={() => setResolveConfirmOpen(false)} isDisabled={chat.sending}>
              {t("supportChat.resolveCancel")}
            </Button>
            <Button className="flex-1" color="success" onPress={resolveConversation} isLoading={chat.sending}>
              {t("supportChat.resolveConfirm")}
            </Button>
          </div>
        )}
      >
        <p className="text-sm leading-6 text-default-600">{t("supportChat.resolveConfirmDescription")}</p>
      </Sheet>
    </>
  );
};

const AttachmentPicker = ({ files, onFiles, onRemove, compact = false }: {
  files: File[];
  onFiles: (files: File[]) => void;
  onRemove: (index: number) => void;
  compact?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <div className={compact ? "mb-2" : ""}>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-divider px-3 py-2 text-xs font-semibold hover:bg-content2 focus-within:ring-2 focus-within:ring-focus">
          <Icon icon="solar:paperclip-linear" width={18} />
          {t("supportChat.dropOrAttach")}
          <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => { onFiles(Array.from(event.target.files || [])); event.target.value = ""; }} />
        </label>
        {files.map((file, index) => (
          <span key={`${file.name}-${file.lastModified}`} className="inline-flex items-center gap-1 rounded-full bg-content2 px-3 py-2 text-xs">
            <span className="max-w-40 truncate">{file.name}</span>
            <button type="button" onClick={() => onRemove(index)} aria-label={t("supportChat.removeAttachment", {name: file.name})}><Icon icon="solar:close-circle-linear" width={16} /></button>
          </span>
        ))}
      </div>
    </div>
  );
};
