export type SupportConnectionMode = "live" | "polling" | "offline";

export type SupportAttachment = {
  id: number;
  name: string;
  mime_type: string;
  size: number;
  download_url: string;
};

export type SupportMessage = {
  id: number;
  session_id: number;
  client_message_id: string | null;
  sender_role: "user" | "admin" | "system";
  sender_name: string | null;
  type: string;
  text: string;
  metadata: Record<string, unknown> | null;
  attachments: SupportAttachment[];
  created_at: string;
};

export type SupportCall = {
  id: number;
  status: string;
  phone?: string | null;
  scheduled_at: string | null;
  attempted_at?: string | null;
  outcome?: string | null;
  created_at: string;
};

export type SupportSession = {
  id: number;
  slug: string;
  parent_ticket_id: number | null;
  subject: string;
  status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
  topic: { id: number; slug: string; title: string } | null;
  order: {
    id: number;
    slug: string;
    number: string;
    status: string;
    payment_status: string;
    currency_code: string;
    total: number;
  } | null;
  assignee: { id: number; name: string } | null;
  resolution_summary: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  messages: SupportMessage[];
  calls: SupportCall[];
  rating: { score: number; feedback: string | null } | null;
};

export type SupportThread = {
  id: number;
  uuid: string;
  active_ticket_id: number | null;
  last_message_at: string | null;
  customer: {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
  };
  sessions: SupportSession[];
  message_pagination: {
    has_more: boolean;
    oldest_message_id: number | null;
  } | null;
};

export type SupportOrder = {
  id: number;
  slug: string;
  number: string;
  status: string;
  payment_status: string;
  currency_code: string;
  total: number;
  created_at: string;
};

export type SupportTopic = {
  id: number;
  slug: string;
  title: string;
  context: "both" | "order" | "general";
  guidance: string | null;
  quick_replies: string[];
};

export type SupportRealtime = {
  driver: string;
  key: string | null;
  host: string | null;
  port: number;
  scheme: string;
  cluster: string;
  auth_endpoint: string;
};

export type SupportThreadPayload = {
  thread: SupportThread;
  recent_orders: SupportOrder[];
  poll_interval_ms: number;
  polling_enabled: boolean;
  realtime: SupportRealtime;
};

export type SupportUpdates = {
  messages: SupportMessage[];
  calls: SupportCall[];
  active_ticket_id: number | null;
  message_cursor: number;
  call_cursor: number;
};

export type SupportMessagePage = {
  messages: SupportMessage[];
  has_more: boolean;
  oldest_message_id: number | null;
};

export type SupportRealtimePayload = {
  user_id: number;
  thread_uuid: string | null;
  configured: boolean;
  realtime: SupportRealtime;
};
