import useSWR from "swr";

import { getBlogs } from "@/services/blogs";

export const useBlogsAvailable = (enabled = true) => {
  const { data } = useSWR(
    enabled ? "blogs:availability" : null,
    () => getBlogs({ per_page: 1 }),
    { dedupingInterval: 60_000, revalidateOnFocus: false },
  );

  return Boolean(data?.success && (data.data?.total ?? 0) > 0);
};
