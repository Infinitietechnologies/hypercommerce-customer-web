import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui";

interface BlogSearchProps {
  value: string;
  onSearch: (value: string) => void;
}

const BlogSearch = ({ value, onSearch }: BlogSearchProps) => {
  const { t } = useTranslation();
  const [input, setInput] = useState(value);

  useEffect(() => {
    if (input.trim() === value) return;
    const timer = window.setTimeout(() => onSearch(input.trim()), 400);
    return () => window.clearTimeout(timer);
  }, [input, value, onSearch]);

  return (
    <Input
      aria-label={t("blogs.search")}
      className="w-full min-[1024px]:max-w-xs"
      placeholder={t("blogs.search")}
      startContent={<Icon aria-hidden="true" icon="solar:magnifer-linear" className="size-5 text-default-500" />}
      type="search"
      value={input}
      onValueChange={setInput}
    />
  );
};

export default BlogSearch;
