import { addToast } from "@heroui/react";

type ToastOptions = Parameters<typeof addToast>[0];

/**
 * Every action needs feedback — success and failure both. These wrap
 * HeroUI's toast so colour and timing stay consistent, matching
 * custom_toast.dart in the Flutter app.
 */
export const toastSuccess = (title: string, description?: string) =>
  addToast({ title, description, color: "success", timeout: 3000 });

export const toastError = (title: string, description?: string) =>
  addToast({ title, description, color: "danger", timeout: 5000 });

export const toastInfo = (title: string, description?: string) =>
  addToast({ title, description, color: "default", timeout: 3000 });

/** Escape hatch for cases the helpers above don't cover. */
export const toast = (options: ToastOptions) => addToast(options);
