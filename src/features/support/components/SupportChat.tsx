import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import Image from "next/image";

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
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const PrivateAttachment = ({ attachment }: { attachment: SupportAttachment }) => {
  const [source, setSource] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!attachment.mime_type.startsWith("image/")) return;
    let active = true;
    let objectUrl = "";
    supportService.downloadAttachment(attachment.download_url).then((blob) => {
      objectUrl = URL.createObjectURL(blob);
      if (active) setSource(objectUrl);
    }).catch(() => active && setFailed(true));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.download_url, attachment.mime_type]);

  const download = async () => {
    try {
      const blob = await supportService.downloadAttachment(attachment.download_url);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setFailed(true);
    }
  };

  if (attachment.mime_type.startsWith("image/")) {
    return source ? (
      <button type="button" onClick={download} className="mt-2 block overflow-hidden rounded-xl border border-divider">
        <Image unoptimized src={source} alt={attachment.name} width={320} height={224} className="max-h-56 max-w-full object-cover" />
      </button>
    ) : (
      <div className="mt-2 flex h-28 w-48 items-center justify-center rounded-xl bg-content2 text-xs text-default-500">
        {failed ? attachment.name : "Loading image…"}
      </div>
    );
  }

  return (
    <button type="button" onClick={download} className="mt-2 flex items-center gap-2 rounded-xl border border-divider bg-content1 px-3 py-2 text-left text-xs font-semibold">
      <Icon icon="solar:file-text-linear" width={20} />
      <span className="max-w-52 truncate">{attachment.name}</span>
      <span className="text-default-400">{formatBytes(attachment.size)}</span>
      <Icon icon="solar:download-linear" width={18} />
    </button>
  );
};

const MessageBubble = ({ message }: { message: SupportMessage }) => {
  if (message.sender_role === "system") {
    return (
      <div className={`mx-auto my-4 max-w-lg rounded-xl border px-4 py-3 text-center text-sm ${message.type === "closure" ? "border-success-200 bg-success-50 text-success-700" : "border-divider bg-content2 text-default-600"}`}>
        <div className="font-semibold">{message.type === "closure" ? "✓ " : ""}{message.text}</div>
        <time className="mt-1 block text-[11px] opacity-70">{formatTime(message.created_at)}</time>
      </div>
    );
  }

  const mine = message.sender_role === "user";
  return (
    <div className={`mb-4 flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border border-divider bg-content1 text-foreground"}`}>
        <div className="mb-1 flex items-center justify-between gap-4 text-[11px] opacity-70">
          <span>{mine ? "You" : message.sender_name || "Support"}</span>
          <time>{formatTime(message.created_at)}</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
        {message.attachments.map((attachment) => <PrivateAttachment key={attachment.id} attachment={attachment} />)}
      </div>
    </div>
  );
};

const SessionTimeline = ({ sessions }: { sessions: SupportSession[] }) => (
  <>
    {[...sessions].sort((left, right) => left.id - right.id).map((session) => (
      <section key={session.id} aria-label={session.slug}>
        <div className="my-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-default-400">
          <span className="h-px flex-1 bg-divider" />
          <span>{session.slug} · {session.topic?.title || "Support"}</span>
          <span className="h-px flex-1 bg-divider" />
        </div>
        {[...session.messages].sort((left, right) => left.id - right.id).map((message) => <MessageBubble key={message.id} message={message} />)}
      </section>
    ))}
  </>
);

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
  const [selectedOrder, setSelectedOrder] = useState<number | null | undefined>(() => {
    const requestedOrder = Number(router.query.order);
    return requestedOrder > 0 ? requestedOrder : undefined;
  });
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [feedback, setFeedback] = useState("");
  const [showOlderOrders, setShowOlderOrders] = useState(false);
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const visibleTopics = useMemo(() => chat.topics.filter((topic) => {
    if (topic.context === "both") return true;
    return selectedOrder ? topic.context === "order" : topic.context === "general";
  }), [chat.topics, selectedOrder]);
  const selectedTopicDetails = useMemo(
    () => chat.topics.find((topic) => topic.id === selectedTopic) ?? null,
    [chat.topics, selectedTopic],
  );

  useEffect(() => {
    timelineRef.current?.scrollTo({top: timelineRef.current.scrollHeight});
  }, [chat.payload?.thread.sessions, chat.remoteTyping]);

  const validateFiles = (files: File[]) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
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
      toastSuccess(t("supportChat.started"));
    } catch {
      toastError(chat.error || t("supportChat.actionFailed"));
    }
  };

  const sendMessage = async () => {
    if (!chat.activeSession || (!message.trim() && !attachments.length)) return;
    try {
      await chat.sendMessage(chat.activeSession, message.trim(), attachments);
      chat.announceTyping(false);
      setMessage("");
      setAttachments([]);
    } catch {
      toastError(chat.error || t("supportChat.sendFailed"));
    }
  };

  const resolveConversation = async () => {
    if (!chat.activeSession) return;
    try {
      await chat.resolve(chat.activeSession);
      setResolveConfirmOpen(false);
      toastSuccess(t("supportChat.resolved"));
    } catch {
      toastError(t("supportChat.actionFailed"));
    }
  };

  if (chat.loading) {
    return <Card className="min-h-[640px] p-5"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="mt-6 h-[480px] w-full rounded-xl" /></Card>;
  }
  if (!chat.payload) {
    return <ErrorState title={t("supportChat.loadFailed")} description={chat.error || undefined} retryLabel={t("common.retry", "Retry")} onRetry={chat.refresh} />;
  }

  const lastSession = chat.payload.thread.sessions.at(-1);
  const modeClasses = chat.connection === "live"
    ? "bg-success-50 text-success-700"
    : chat.connection === "offline"
      ? "bg-danger-50 text-danger-700"
      : "bg-warning-50 text-warning-700";

  return (
    <>
      <Card className="h-[calc(100dvh-10rem)] min-h-[620px] overflow-hidden">
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b border-divider bg-content1 px-4 py-3 sm:px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <Icon icon="solar:chat-round-dots-linear" width={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold">{t("supportChat.title")}</h1>
            <p className="truncate text-xs text-default-500">{chat.activeSession ? `${chat.activeSession.slug} · ${chat.activeSession.topic?.title || ""}` : t("supportChat.assistant")}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${modeClasses}`}>{t(`supportChat.connection.${chat.connection}`)}</span>
          {chat.activeSession ? (
            <>
              <Button size="sm" variant="flat" onPress={() => chat.requestCallback(chat.activeSession!).then(() => toastSuccess(t("supportChat.callbackRequested"))).catch(() => toastError(t("supportChat.actionFailed")))} isLoading={chat.sending}>
                <Icon icon="solar:phone-calling-linear" width={17} />
                <span className="hidden sm:inline">{t("supportChat.callback")}</span>
              </Button>
              <Button size="sm" color="success" variant="flat" onPress={() => setResolveConfirmOpen(true)} isLoading={chat.sending}>
                <Icon icon="solar:check-circle-linear" width={17} />
                <span className="hidden sm:inline">{t("supportChat.resolve")}</span>
              </Button>
            </>
          ) : null}
        </header>

        <div ref={timelineRef} className="flex-1 overflow-y-auto bg-content2/40 px-3 py-4 sm:px-6">
          {chat.payload.thread.sessions.length ? <SessionTimeline sessions={chat.payload.thread.sessions} /> : (
            <div className="mx-auto max-w-lg py-8 text-center">
              <Icon icon="solar:help-outline" width={44} className="mx-auto text-primary-500" />
              <h2 className="mt-3 text-lg font-bold">{t("supportChat.welcome")}</h2>
              <p className="mt-1 text-sm text-default-500">{t("supportChat.welcomeDescription")}</p>
            </div>
          )}

          {chat.remoteTyping ? (
            <div className="mb-4 flex justify-start" aria-live="polite">
              <div className="rounded-2xl rounded-bl-sm border border-divider bg-content1 px-4 py-3 text-sm text-default-500">
                {t("supportChat.typing")}
              </div>
            </div>
          ) : null}

          {!chat.activeSession && selectedOrder === undefined ? (
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

          {!chat.activeSession && selectedOrder !== undefined && !selectedTopic ? (
            <Card className="mx-auto mt-5 max-w-xl">
              <CardBody className="gap-3 p-4">
                <div className="flex items-center gap-2">
                  <Button isIconOnly size="sm" variant="light" onPress={() => setSelectedOrder(undefined)} aria-label={t("common.back", "Back")}><Icon icon="solar:arrow-left-linear" /></Button>
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

          {!chat.activeSession && selectedTopic ? (
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
                  <div className="flex flex-wrap gap-2">
                    {selectedTopicDetails.quick_replies.map((reply) => (
                      <Button key={reply} size="sm" variant={message === reply ? "solid" : "bordered"} onPress={() => setMessage(reply)}>
                        {reply}
                      </Button>
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
                <div className="flex gap-2" dir="ltr">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button key={score} type="button" onClick={() => chat.rate(lastSession, score, feedback).then(() => toastSuccess(t("supportChat.thanks"))).catch(() => toastError(t("supportChat.actionFailed")))} className="text-3xl text-warning transition-transform hover:scale-110" aria-label={`${score} stars`}>☆</button>
                  ))}
                </div>
                <Textarea value={feedback} onValueChange={setFeedback} maxLength={2000} minRows={2} placeholder={t("supportChat.feedbackPlaceholder")} />
              </CardBody>
            </Card>
          ) : null}

          {!chat.activeSession && chat.payload.thread.sessions.length ? (
            <div className="my-5 text-center text-sm font-semibold">{t("supportChat.stillIssue")} <button type="button" className="text-primary underline" onClick={() => { setSelectedOrder(undefined); setSelectedTopic(null); }}>{t("supportChat.chatWithUs")}</button></div>
          ) : null}
        </div>

        {chat.activeSession ? (
          <footer className="border-t border-divider bg-content1 p-3 sm:p-4">
            <AttachmentPicker files={attachments} onFiles={validateFiles} onRemove={(index) => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} compact />
            <div className="flex items-end gap-2">
              <Textarea value={message} onValueChange={(value) => { setMessage(value); chat.announceTyping(Boolean(value.trim())); }} maxLength={4000} minRows={1} maxRows={5} placeholder={t("supportChat.messagePlaceholder")} className="flex-1" />
              <Button isIconOnly onPress={sendMessage} isLoading={chat.sending} isDisabled={!message.trim() && !attachments.length} aria-label={t("supportChat.send")}>
                <Icon icon="solar:plain-2-bold" width={20} />
              </Button>
            </div>
          </footer>
        ) : null}
      </div>
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
}) => (
  <div className={compact ? "mb-2" : ""}>
    <div className="flex flex-wrap gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-divider px-3 py-2 text-xs font-semibold hover:bg-content2">
        <Icon icon="solar:paperclip-linear" width={18} />
        Attach
        <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => { onFiles(Array.from(event.target.files || [])); event.target.value = ""; }} />
      </label>
      {files.map((file, index) => (
        <span key={`${file.name}-${file.lastModified}`} className="inline-flex items-center gap-1 rounded-full bg-content2 px-3 py-2 text-xs">
          <span className="max-w-40 truncate">{file.name}</span>
          <button type="button" onClick={() => onRemove(index)} aria-label={`Remove ${file.name}`}><Icon icon="solar:close-circle-linear" width={16} /></button>
        </span>
      ))}
    </div>
  </div>
);
