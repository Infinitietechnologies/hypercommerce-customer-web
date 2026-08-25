import { useEffect, useState } from "react";
import { useRouter, type NextRouter } from "next/router";
import {
  FirebaseInstance,
  initializeFirebase,
  initializeFirebaseAnalytics,
} from "@/lib/firebase";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  setFirebaseInstance,
} from "@/lib/analytics";
import { RecaptchaVerifier } from "firebase/auth";
import {
  firebaseConfigType,
  NotificationSettings,
  Settings,
} from "@/types/ApiResponse";
import { Avatar, closeToast, toast } from "@/components/ui";
import { getFirebaseConfig, getSpecificSettings } from "@/helpers/getters";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { Bell } from "lucide-react";
import {
  getNotificationRedirectUrl,
  NotificationData,
} from "@/helpers/notificationUrl";

interface FirebaseInitializerProps {
  settings: Settings;
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    firebaseInstance?: FirebaseInstance;
  }
}

type NotificationPayload = {
  notification?: {
    title?: string;
    body?: string;
    image?: string;
    icon?: string;
  };
  data?: NotificationData;
};

const FIREBASE_MESSAGING_SW_PATH = "/firebase-messaging-sw.js";
const FIREBASE_MESSAGING_SW_SCOPE = "/firebase-cloud-messaging-push-scope";

let messagingInitialization: Promise<void> | null = null;

const playNotificationSound = () => {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch((e) => console.log("Sound blocked by browser:", e));
  } catch (error) {
    console.error("Audio play failed:", error);
  }
};

const showNotification = (
  payload: NotificationPayload,
  router?: NextRouter,
) => {
  if (!payload.notification) return;

  playNotificationSound();
  const { title, body, image } = payload.notification;
  const url = getNotificationRedirectUrl(payload.data);

  // generate unique ID if you still want one for CSS purpose
  const toastClass = `toast-clickable-${Date.now()}`;

  // Create the toast and capture its key
  const toastKey = toast({
    title: title || "New Notification",
    description: body || "You have a new message",
    color: "default",
    timeout: 10000,
    classNames: { wrapper: toastClass },
    icon: image ? (
      <Avatar size="md" src={image} />
    ) : (
      <Bell className="w-6 h-6" />
    ),
  });

  // Attach click listener after slight delay to ensure DOM mounting
  setTimeout(() => {
    const toastEl = document.querySelector(
      `.${toastClass}`,
    ) as HTMLElement | null;
    if (toastEl && url) {
      toastEl.style.cursor = "pointer";
      const handleClick = () => {
        if (/^https?:\/\//i.test(url)) {
          window.open(url, "_blank", "noopener,noreferrer");
        } else if (router) {
          router.push(url);
        }
        if (toastKey) closeToast(toastKey);
      };
      toastEl.addEventListener("click", handleClick, { once: true });
    }
  }, 100);
};

const waitForActiveServiceWorker = (
  registration: ServiceWorkerRegistration,
): Promise<ServiceWorker> => {
  if (registration.active) return Promise.resolve(registration.active);

  const worker = registration.installing ?? registration.waiting;
  if (!worker) {
    return Promise.reject(new Error("Firebase service worker is unavailable"));
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      worker.removeEventListener("statechange", handleStateChange);
      reject(new Error("Firebase service worker activation timed out"));
    }, 10000);

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      worker.removeEventListener("statechange", handleStateChange);
    };

    const handleStateChange = () => {
      if (worker.state === "activated") {
        cleanup();
        resolve(worker);
      } else if (worker.state === "redundant") {
        cleanup();
        reject(new Error("Firebase service worker became redundant"));
      }
    };

    worker.addEventListener("statechange", handleStateChange);
    handleStateChange();
  });
};

const setupMessaging = async (
  firebaseInstance: FirebaseInstance,
  vapIdKey: string,
  firebaseConfig: firebaseConfigType,
) => {
  if (!(await isSupported())) return;

  const serviceWorkerRegistration = await navigator.serviceWorker.register(
    FIREBASE_MESSAGING_SW_PATH,
    { scope: FIREBASE_MESSAGING_SW_SCOPE },
  );
  const activeWorker = await waitForActiveServiceWorker(
    serviceWorkerRegistration,
  );
  activeWorker.postMessage({
    type: "INIT_FIREBASE",
    config: firebaseConfig,
  });

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const messaging = getMessaging(firebaseInstance.app);
  const token = await getToken(messaging, {
    vapidKey: vapIdKey,
    serviceWorkerRegistration,
  });
  if (token) {
    localStorage.setItem("fcm-token", token);
  }
};

const initializeMessaging = async (
  firebaseInstance: FirebaseInstance,
  vapIdKey: string,
  firebaseConfig: firebaseConfigType,
) => {
  if (!messagingInitialization) {
    messagingInitialization = setupMessaging(
      firebaseInstance,
      vapIdKey,
      firebaseConfig,
    ).catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unknown messaging error";
      console.warn("Push notifications are unavailable:", message);
    });
  }

  return messagingInitialization;
};

export default function FirebaseInitializer({
  settings,
}: FirebaseInitializerProps) {
  const router = useRouter();
  const [firebase, setFirebase] = useState<FirebaseInstance | null>(null);

  useEffect(() => {
    try {
      const firebaseConfig = getFirebaseConfig(settings);
      const notificationSettings = getSpecificSettings(
        settings,
        "notification",
      ) as NotificationSettings | undefined;

      const { vapIdKey = "" } = notificationSettings || {};

      if (firebaseConfig && !firebase) {
        const firebaseInstance = initializeFirebase(firebaseConfig);

        if (!firebaseInstance) {
          const errorMsg = "Failed to initialize Firebase instance";
          console.error(errorMsg);
          toast({
            title: "Firebase Error",
            description: errorMsg,
            color: "danger",
          });
          return;
        }

        // 👇 defer setState to next microtask to avoid cascading render
        queueMicrotask(() => {
          setFirebase(firebaseInstance);
          window.firebaseInstance = firebaseInstance;
          setFirebaseInstance(firebaseInstance);
        });

        if (typeof window !== "undefined") {
          try {
            const auth = firebaseInstance.auth;
            auth.settings.appVerificationDisabledForTesting = false;

            console.log("Firebase initialized successfully");

            if (
              vapIdKey &&
              "serviceWorker" in navigator &&
              "Notification" in window
            ) {
              initializeMessaging(firebaseInstance, vapIdKey, firebaseConfig);
            }
          } catch (authError) {
            const errorMsg = `Failed to configure Firebase Auth: ${
              authError instanceof Error ? authError.message : "Unknown error"
            }`;
            console.error(errorMsg);
            toast({
              title: "Firebase Auth Error",
              description: errorMsg,
              color: "danger",
            });
          }
        }
      }
    } catch (error) {
      const errorMsg = `Error processing Firebase initialization: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      console.error(errorMsg);
      toast({
        title: "Firebase Initialization Error",
        description: errorMsg,
        color: "danger",
      });
    }
  }, [settings, firebase]);

  useEffect(() => {
    if (!firebase || process.env.NODE_ENV !== "production") return;

    const initializeAnalyticsAfterConsent = () => {
      if (getAnalyticsConsent() !== "accepted") return;

      void initializeFirebaseAnalytics(firebase).then(() => {
        setFirebaseInstance(firebase);
      });
    };

    initializeAnalyticsAfterConsent();
    window.addEventListener(
      ANALYTICS_CONSENT_EVENT,
      initializeAnalyticsAfterConsent,
    );

    return () => {
      window.removeEventListener(
        ANALYTICS_CONSENT_EVENT,
        initializeAnalyticsAfterConsent,
      );
    };
  }, [firebase]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const handler = (event: MessageEvent) => {
        if (event.data?.type === "PUSH_EVENT") {
          showNotification(event.data.payload, router);
        }
      };
      navigator.serviceWorker.addEventListener("message", handler);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handler);
      };
    }
    return undefined;
  }, [router]);

  return null;
}
