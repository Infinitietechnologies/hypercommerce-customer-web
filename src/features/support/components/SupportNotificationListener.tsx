import { useEffect } from "react";
import { closeToast, Link, toast } from "@/components/ui";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import { getCookie } from "@/lib/cookies";
import { supportService } from "@/services/support";

type Activity = {
  activity: string;
  thread_uuid: string;
  message?: {
    sender_role?: string;
    sender_name?: string | null;
    preview?: string;
  } | null;
};

const SupportNotificationListener = () => {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (router.pathname.startsWith("/my-account/support") || !getCookie("access_token")) return;

    let disposed = false;
    let echo: { disconnect: () => void } | null = null;

    void supportService.getRealtime().then(async (payload) => {
      if (disposed || !payload.configured || !payload.realtime.key) return;
      const [{ default: Echo }, { default: Pusher }] = await Promise.all([import("laravel-echo"), import("pusher-js")]);
      if (disposed) return;
      const token = String(getCookie("access_token") || "");
      const headers = {Authorization: `Bearer ${token}`, Accept: "application/json"};
      const realtime = payload.realtime;
      const instance = new Echo({
        broadcaster: realtime.driver === "reverb" ? "reverb" : "pusher",
        Pusher,
        key: realtime.key || "",
        cluster: realtime.cluster || "mt1",
        wsHost: realtime.host || undefined,
        wsPort: realtime.port || 80,
        wssPort: realtime.port || 443,
        forceTLS: realtime.scheme === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: realtime.auth_endpoint,
        auth: {headers},
        channelAuthorization: {endpoint: realtime.auth_endpoint, transport: "ajax", headers},
      });
      echo = instance;
      instance.private(`support.user.${payload.user_id}`).listen(".support.activity", (event: Activity) => {
        if (!["message.created", "session.created"].includes(event.activity) || event.message?.sender_role !== "admin") return;
        const title = event.message.sender_name
          ? t("supportChat.notificationFrom", {name: event.message.sender_name})
          : t("supportChat.notificationTitle");
        const description = event.message.preview || t("supportChat.notificationBody");
        const toastKey = toast({
          title: (
            <Link
              href="/my-account/support/"
              color="foreground"
              className="w-full flex-col items-start gap-1 rounded-small text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
              onClick={() => { if (toastKey) closeToast(toastKey); }}
            >
              <span className="text-sm font-medium">{title}</span>
              <span className="text-sm font-normal text-default-600">{description}</span>
            </Link>
          ),
          color: "primary",
        });
        if (document.hidden && window.Notification?.permission === "granted") {
          const notification = new Notification(title, {body: description, tag: `support-${event.thread_uuid}`});
          notification.onclick = () => {
            window.focus();
            void router.push("/my-account/support/");
            notification.close();
          };
        }
      });
    }).catch(() => undefined);

    return () => {
      disposed = true;
      echo?.disconnect();
    };
  }, [router, router.pathname, t]);

  return null;
};

export default SupportNotificationListener;
