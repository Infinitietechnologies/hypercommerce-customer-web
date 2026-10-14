import { createElement, Fragment, type ReactNode } from "react";

interface ContentNode {
  tag: string;
  text?: string;
  href?: string;
  src?: string;
  alt?: string;
  children: ContentNode[];
}

const allowedTags = new Set([
  "p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "strong", "b", "em", "i", "a", "br", "figure", "figcaption", "img", "pre", "code",
]);

const decodeEntities = (text: string) =>
  text.replace(/&(#(?:x[0-9a-f]+|\d+)|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
    const named: Record<string, string> = {
      amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    };
    if (entity.startsWith("#")) {
      const number = entity[1]?.toLowerCase() === "x"
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(number) && number > 0 && number <= 0x10ffff
        ? String.fromCodePoint(number)
        : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });

const parseContent = (html: string): ContentNode[] => {
  const root: ContentNode = { tag: "root", children: [] };
  const stack = [root];
  const cleaned = html
    .replace(/<(script|style|iframe|object|svg|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  for (const token of cleaned.match(/<[^>]*>|[^<]+/g) ?? []) {
    const closing = token.match(/^<\/\s*([a-z][\w-]*)/i);
    if (closing) {
      const tag = closing[1].toLowerCase();
      const index = stack.findLastIndex((node) => node.tag === tag);
      if (index > 0) stack.length = index;
      continue;
    }
    const opening = token.match(/^<\s*([a-z][\w-]*)([^>]*)>/i);
    if (opening) {
      const tag = opening[1].toLowerCase();
      if (!allowedTags.has(tag)) continue;
      const hrefMatch = tag === "a" ? opening[2].match(/\bhref\s*=\s*["']([^"']+)["']/i) : null;
      const href = hrefMatch?.[1];
      const safeHref = href && (/^https?:\/\//i.test(href) || /^\/(?!\/)/.test(href)) ? href : undefined;
      const srcMatch = tag === "img" ? opening[2].match(/\bsrc\s*=\s*["']([^"']+)["']/i) : null;
      const src = srcMatch?.[1];
      if (tag === "img" && (!src || !/^https:\/\//i.test(src))) continue;
      const altMatch = tag === "img" ? opening[2].match(/\balt\s*=\s*["']([^"']*)["']/i) : null;
      const node: ContentNode = { tag, href: safeHref, src, alt: altMatch?.[1] ?? "", children: [] };
      stack.at(-1)?.children.push(node);
      if (tag !== "br" && tag !== "img" && !/\/\s*>$/.test(token)) stack.push(node);
      continue;
    }
    stack.at(-1)?.children.push({ tag: "text", text: decodeEntities(token), children: [] });
  }
  return root.children;
};

const classes: Record<string, string> = {
  h2: "mt-10 mb-4 text-2xl font-bold leading-tight text-foreground",
  h3: "mt-8 mb-3 text-xl font-bold leading-snug text-foreground",
  h4: "mt-6 mb-2 text-lg font-semibold text-foreground",
  p: "mb-5 text-base leading-8 text-default-700",
  ul: "mb-6 list-disc space-y-2 ps-6 text-default-700",
  ol: "mb-6 list-decimal space-y-2 ps-6 text-default-700",
  li: "leading-7",
  blockquote: "my-8 rounded-medium border-s-4 border-primary bg-content2 px-5 py-4 italic text-default-700",
  a: "font-semibold text-primary underline underline-offset-2",
  figure: "my-8",
  figcaption: "mt-2 text-center text-sm text-default-500",
  img: "h-auto max-w-full rounded-medium",
  pre: "my-6 overflow-x-auto rounded-medium bg-content2 p-4 text-sm",
  code: "rounded-small bg-content2 px-1 py-0.5 text-sm",
};

const renderNodes = (nodes: ContentNode[]): ReactNode =>
  nodes.map((node, index) => {
    if (node.tag === "text") return <Fragment key={index}>{node.text}</Fragment>;
    return createElement(
      node.tag,
      {
        key: index,
        className: classes[node.tag],
        ...(node.tag === "a" && node.href ? { href: node.href, rel: "noopener noreferrer" } : {}),
        ...(node.tag === "img" ? { src: node.src, alt: node.alt, loading: "lazy" } : {}),
      },
      renderNodes(node.children),
    );
  });

const BlogContent = ({ html }: { html: string }) => (
  <div className="max-w-none break-words">{renderNodes(parseContent(html))}</div>
);

export default BlogContent;
