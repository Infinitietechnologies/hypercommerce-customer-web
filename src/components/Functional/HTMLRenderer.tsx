// components/HTMLRenderer.tsx

import { FC, useMemo } from "react";

import { sanitizeHtml } from "@/helpers/sanitizeHtml";

interface HTMLRendererProps {
  html: string;
  className?: string;
}

const HTMLRenderer: FC<HTMLRendererProps> = ({ html, className }) => {
  const safeHtml = useMemo(() => sanitizeHtml(html), [html]);

  return (
    <div
      className={`html-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
};

export default HTMLRenderer;
