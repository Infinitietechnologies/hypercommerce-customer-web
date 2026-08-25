import i18n from "i18next";
import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp,
  FirebaseOptions,
  FirebaseError,
} from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
} from "firebase/auth";
import {
  Analytics,
  initializeAnalytics,
  isSupported as isAnalyticsSupported,
} from "firebase/analytics";
import { toast } from "@/components/ui";

// Define the Firebase instance type
export interface FirebaseInstance {
  app: FirebaseApp;
  auth: Auth;
  googleProvider: GoogleAuthProvider;
  appleProvider: OAuthProvider;
  recaptchaVerifier?: RecaptchaVerifier | null;
  analytics?: Analytics | null;
}

let firebaseApp: FirebaseApp | null = null;
let cachedFirebaseInstance: FirebaseInstance | null = null;

export function initializeFirebase(
  firebaseConfig: FirebaseOptions,
): FirebaseInstance | null {
  try {
    // Return cached instance if available
    if (cachedFirebaseInstance) {
      return cachedFirebaseInstance;
    }

    // Validate configuration
    if (!firebaseConfig || typeof firebaseConfig !== "object") {
      const errorMsg = "Invalid or missing Firebase configuration";
      console.error(errorMsg);
      return null;
    }

    // Initialize Firebase only if it hasn't been initialized
    if (!getApps().length) {
      try {
        firebaseApp = initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
      } catch (initError) {
        const errorMsg = `Failed to initialize Firebase: ${
          initError instanceof Error ? initError.message : "Unknown error"
        }`;
        console.error(errorMsg);
        return null;
      }
    } else {
      try {
        firebaseApp = getApp();
        console.log("Using existing Firebase app");
      } catch (getAppError) {
        const errorMsg = `Failed to get existing Firebase app: ${
          getAppError instanceof Error ? getAppError.message : "Unknown error"
        }`;
        console.error(errorMsg);
        return null;
      }
    }

    // Initialize Firebase Authentication and providers
    let auth: Auth;
    let googleProvider: GoogleAuthProvider;
    let appleProvider: OAuthProvider;

    try {
      auth = getAuth(firebaseApp);
      googleProvider = new GoogleAuthProvider();
      appleProvider = new OAuthProvider("apple.com");
    } catch (authError) {
      const errorMsg = `Failed to initialize Firebase Auth: ${
        authError instanceof Error ? authError.message : "Unknown error"
      }`;
      console.error(errorMsg);
      toast({
        title: "Firebase Auth Error",
        description: errorMsg,
        color: "danger",
      });
      return null;
    }

    const instance: FirebaseInstance = {
      app: firebaseApp,
      auth,
      googleProvider,
      appleProvider,
      analytics: null,
    };

    // Cache the instance
    cachedFirebaseInstance = instance;

    return instance;
  } catch (error) {
    const errorMsg = `Firebase setup failed: ${
      error instanceof Error ? error.message : "Unknown error occurred"
    }`;
    console.error("Firebase initialization error:", errorMsg);
    toast({
      title: "Firebase Setup Error",
      description: errorMsg,
      color: "danger",
    });
    return null;
  }
}

let firebaseAnalyticsInitialization: Promise<Analytics | null> | null = null;

export function initializeFirebaseAnalytics(
  firebaseInstance: FirebaseInstance,
): Promise<Analytics | null> {
  if (process.env.NODE_ENV !== "production") {
    return Promise.resolve(null);
  }

  if (firebaseInstance.analytics) {
    return Promise.resolve(firebaseInstance.analytics);
  }

  if (!firebaseAnalyticsInitialization) {
    firebaseAnalyticsInitialization = isAnalyticsSupported()
      .then((supported) => {
        if (!supported) return null;

        const analytics = initializeAnalytics(firebaseInstance.app, {
          config: { send_page_view: false },
        });
        firebaseInstance.analytics = analytics;
        return analytics;
      })
      .catch((error: unknown) => {
        console.warn("Firebase Analytics is unavailable:", error);
        return null;
      });
  }

  return firebaseAnalyticsInitialization;
}

//function to properly clear reCAPTCHA

export function clearRecaptchaVerifier(
  firebaseInstance: FirebaseInstance,
): void {
  try {
    if (firebaseInstance.recaptchaVerifier) {
      // Clear the reCAPTCHA widget
      firebaseInstance.recaptchaVerifier.clear();
      firebaseInstance.recaptchaVerifier = null;
    }

    // Remove all recaptcha containers (both fixed and unique ones)
    const containers = document.querySelectorAll('[id^="recaptcha-container"]');
    containers.forEach((container) => {
      container.remove();
    });

    // Create a fresh main container element
    const newContainer = document.createElement("div");
    newContainer.id = "recaptcha-container";
    newContainer.style.display = "none";
    document.body.appendChild(newContainer);

    console.log("reCAPTCHA verifier cleared and container recreated");
  } catch (error) {
    console.warn("Error clearing reCAPTCHA verifier:", error);
    // Force recreate the container even if clearing the verifier fails
    const containers = document.querySelectorAll('[id^="recaptcha-container"]');
    containers.forEach((container) => {
      container.remove();
    });

    const newContainer = document.createElement("div");
    newContainer.id = "recaptcha-container";
    newContainer.style.display = "none";
    document.body.appendChild(newContainer);
  }
}

// Updated initializeRecaptchaVerifier function
export function initializeRecaptchaVerifier(
  firebaseInstance: FirebaseInstance,
): RecaptchaVerifier | null {
  try {
    // Always clear any existing RecaptchaVerifier first
    if (firebaseInstance.recaptchaVerifier) {
      clearRecaptchaVerifier(firebaseInstance);
    }

    // Ensure container exists (clearRecaptchaVerifier creates it if needed)
    let recaptchaContainer = document.getElementById("recaptcha-container");
    if (!recaptchaContainer) {
      recaptchaContainer = document.createElement("div");
      recaptchaContainer.id = "recaptcha-container";
      recaptchaContainer.style.display = "none";
      document.body.appendChild(recaptchaContainer);
    }

    // Create a new RecaptchaVerifier with a unique ID
    const uniqueId = "recaptcha-container-" + Date.now();
    const uniqueContainer = document.createElement("div");
    uniqueContainer.id = uniqueId;
    uniqueContainer.style.display = "none";
    document.body.appendChild(uniqueContainer);

    const recaptchaVerifier = new RecaptchaVerifier(
      firebaseInstance.auth,
      uniqueId,
      {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA verified");
        },
        "expired-callback": () => {
          console.log("reCAPTCHA expired");
          toast({
            title: "reCAPTCHA Expired",
            description: "Please refresh and try again",
            color: "warning",
          });
        },
        "error-callback": () => {
          toast({
            title: "reCAPTCHA Error",
            description: "Please refresh and try again",
            color: "danger",
          });
        },
      },
    );

    // Cache the new verifier in the Firebase instance
    firebaseInstance.recaptchaVerifier = recaptchaVerifier;

    return recaptchaVerifier;
  } catch (error) {
    const errorMsg = `Failed to initialize RecaptchaVerifier: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    console.error(errorMsg);
    toast({
      title: "reCAPTCHA Setup Error",
      description: errorMsg,
      color: "danger",
    });
    return null;
  }
}

const FIREBASE_ERROR_KEYS: Record<string, string> = {
  "auth/invalid-phone-number": "firebase.errors.invalid_phone_number",
  "auth/invalid-verification-code": "firebase.errors.invalid_verification_code",
  "auth/code-expired": "firebase.errors.code_expired",
  "auth/too-many-requests": "firebase.errors.too_many_requests",
  "auth/quota-exceeded": "firebase.errors.quota_exceeded",
  "auth/missing-verification-code": "firebase.errors.missing_verification_code",
  "auth/network-request-failed": "firebase.errors.network_request_failed",
  "auth/captcha-check-failed": "firebase.errors.captcha_check_failed",
  "auth/operation-not-allowed": "firebase.errors.operation_not_allowed",
};

/** The raw SDK message is never surfaced — it is English and unbounded. */
export const getFirebaseErrorMessage = (error: FirebaseError) => {
  const key = FIREBASE_ERROR_KEYS[error?.code ?? ""];

  return i18n.t(key ?? "firebase.errors.default");
};
