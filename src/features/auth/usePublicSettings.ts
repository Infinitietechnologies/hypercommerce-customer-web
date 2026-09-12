import useSWR from "swr";

import { getSettings } from "@/services/settings";
import type { Settings } from "@/types/settings";

export const usePublicSettings = () =>
  useSWR<Settings | null>("/settings", async () => {
    const response = await getSettings();
    return response.data ?? null;
  });
