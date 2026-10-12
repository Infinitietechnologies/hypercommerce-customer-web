import { useCallback, useEffect, useState } from "react";

import { getSharedCartPreview } from "@/features/cartSharing/sharedCartPayload";
import { getSharedCart, importSharedCart } from "@/services/cart";
import type { SharedCartPreview } from "@/types/sharedCart";

type SharedCartStatus = "idle" | "loading" | "ready" | "empty" | "error";

export const useSharedCart = (token: string, enabled: boolean) => {
  const [status, setStatus] = useState<SharedCartStatus>("idle");
  const [preview, setPreview] = useState<SharedCartPreview | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const load = useCallback(async () => {
    if (!token || !enabled) return;
    setStatus("loading");
    const response = await getSharedCart(token);
    const parsed = response.success ? getSharedCartPreview(response.data) : null;
    if (!parsed) {
      setPreview(null);
      setStatus("error");
      return;
    }
    setPreview(parsed);
    setStatus(parsed.items.length ? "ready" : "empty");
  }, [enabled, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const importItems = useCallback(async () => {
    if (!token || !enabled || isImporting || status !== "ready") return false;
    setIsImporting(true);
    try {
      const response = await importSharedCart(token);
      return response.success;
    } finally {
      setIsImporting(false);
    }
  }, [enabled, isImporting, status, token]);

  return { status, preview, isImporting, load, importItems };
};
