import api from "@/services/client";
import type {
  SupportSession,
  SupportThreadPayload,
  SupportTopic,
  SupportUpdates,
  SupportMessage,
  SupportMessagePage,
  SupportRealtimePayload,
} from "@/types/support";

type TokenParams = { access_token?: string };

const data = <T>(response: { data: { data: T } }): T => response.data.data;

export const supportService = {
  async getThread(params: TokenParams = {}): Promise<SupportThreadPayload> {
    return data(await api.get("/user/support/thread", { params }));
  },

  async getTopics(params: TokenParams = {}): Promise<SupportTopic[]> {
    return data(await api.get("/user/support/topics", { params }));
  },

  async getUpdates(afterMessageId: number, afterCallId: number): Promise<SupportUpdates> {
    return data(await api.get("/user/support/thread/updates", {
      params: { after_message_id: afterMessageId, after_call_id: afterCallId },
    }));
  },

  async getOlderMessages(beforeMessageId: number): Promise<SupportMessagePage> {
    return data(await api.get("/user/support/thread/messages", {
      params: { before_message_id: beforeMessageId, limit: 50 },
    }));
  },

  async getRealtime(): Promise<SupportRealtimePayload> {
    return data(await api.get("/user/support/realtime"));
  },

  async startSession(input: {
    topicId: number;
    orderId?: number;
    message?: string;
    attachments?: File[];
  }): Promise<SupportSession> {
    const body = new FormData();
    body.append("topic_id", String(input.topicId));
    body.append("client_message_id", crypto.randomUUID());
    if (input.orderId) body.append("order_id", String(input.orderId));
    if (input.message) body.append("message", input.message);
    input.attachments?.forEach((file) => body.append("attachments[]", file));
    return data(await api.post("/user/support/sessions", body));
  },

  async sendMessage(slug: string, message: string, attachments: File[]): Promise<SupportMessage> {
    const body = new FormData();
    body.append("message", message);
    body.append("client_message_id", crypto.randomUUID());
    attachments.forEach((file) => body.append("attachments[]", file));
    return data(await api.post(`/user/support/sessions/${slug}/messages`, body));
  },

  async markRead(slug: string, messageId: number): Promise<void> {
    await api.post(`/user/support/sessions/${slug}/read`, { message_id: messageId });
  },

  async typing(slug: string, typing: boolean): Promise<void> {
    await api.post(`/user/support/sessions/${slug}/typing`, { typing });
  },

  async requestCallback(slug: string, phone?: string): Promise<void> {
    await api.post(`/user/support/sessions/${slug}/callbacks`, { phone: phone || null });
  },

  async resolve(slug: string, summary?: string): Promise<void> {
    await api.post(`/user/support/sessions/${slug}/resolve`, { summary: summary || null });
  },

  async rate(slug: string, score: number, feedback?: string): Promise<void> {
    await api.post(`/user/support/sessions/${slug}/rating`, { score, feedback: feedback || null });
  },

  async downloadAttachment(url: string): Promise<Blob> {
    const response = await api.get<Blob>(url, { responseType: "blob", baseURL: "" });
    return response.data;
  },
};
