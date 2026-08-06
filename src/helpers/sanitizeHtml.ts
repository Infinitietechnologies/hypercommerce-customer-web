/**
 * Allow-list sanitiser for API-supplied HTML (product/store descriptions, CMS
 * pages). Runs identically on the server and in the browser, so it needs no DOM
 * and no extra dependency.
 */

const ALLOWED_TAGS: Record<string, readonly string[]> = {
  a: ["href", "title", "target", "rel"],
  abbr: ["title"],
  b: [],
  blockquote: [],
  br: [],
  code: [],
  div: [],
  em: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  hr: [],
  i: [],
  img: ["src", "alt", "title", "width", "height"],
  li: [],
  ol: ["start"],
  p: [],
  pre: [],
  s: [],
  small: [],
  span: [],
  strong: [],
  sub: [],
  sup: [],
  table: [],
  tbody: [],
  td: ["colspan", "rowspan"],
  tfoot: [],
  th: ["colspan", "rowspan"],
  thead: [],
  tr: [],
  u: [],
  ul: [],
};

const VOID_TAGS = new Set(["br", "hr", "img"]);

/** Tags whose *content* is dropped as well, not just the tag itself. */
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "noscript",
  "template",
  "svg",
  "math",
]);

const URL_ATTRIBUTES = new Set(["href", "src"]);
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const SAFE_SCHEME =
  /^(https?:|mailto:|tel:|data:image\/(png|jpe?g|gif|webp);base64,)/i;

const TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;
const ATTRIBUTE_PATTERN =
  /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

const escapeAttribute = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** Relative paths pass; anything carrying a scheme must carry a safe one. */
const isSafeUrl = (value: string) => {
  const trimmed = value.trim();

  return HAS_SCHEME.test(trimmed) ? SAFE_SCHEME.test(trimmed) : true;
};

/** Allowed on every tag — they carry the author's formatting, not behaviour. */
const GLOBAL_ATTRIBUTES = ["class", "style", "dir"];

const UNSAFE_STYLE = /(expression\s*\(|url\s*\(\s*['"]?\s*(?!https?:|data:image\/)[a-z]+:)/i;

const buildAttributes = (tag: string, raw: string): string => {
  const allowed = [...(ALLOWED_TAGS[tag] ?? []), ...GLOBAL_ATTRIBUTES];

  const parts: string[] = [];
  let match: RegExpExecArray | null;

  ATTRIBUTE_PATTERN.lastIndex = 0;
  while ((match = ATTRIBUTE_PATTERN.exec(raw)) !== null) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";

    if (!allowed.includes(name)) continue;
    if (URL_ATTRIBUTES.has(name) && !isSafeUrl(value)) continue;
    if (name === "style" && UNSAFE_STYLE.test(value)) continue;

    parts.push(`${name}="${escapeAttribute(value)}"`);
  }

  if (tag === "a") {
    const hasTarget = parts.some((part) => part.startsWith("target="));
    if (hasTarget && !parts.some((part) => part.startsWith("rel="))) {
      parts.push('rel="noopener noreferrer"');
    }
  }

  return parts.length > 0 ? ` ${parts.join(" ")}` : "";
};

export const sanitizeHtml = (html?: string | null): string => {
  if (!html) return "";

  let output = "";
  let cursor = 0;
  let skipUntil: string | null = null;
  let match: RegExpExecArray | null;

  TAG_PATTERN.lastIndex = 0;
  while ((match = TAG_PATTERN.exec(html)) !== null) {
    const [full, rawName, rawAttrs] = match;
    const tag = rawName.toLowerCase();
    const isClosing = full.startsWith("</");
    const text = html.slice(cursor, match.index);

    if (!skipUntil) output += text;
    cursor = match.index + full.length;

    if (skipUntil) {
      if (isClosing && tag === skipUntil) skipUntil = null;
      continue;
    }

    if (DROP_WITH_CONTENT.has(tag)) {
      if (!isClosing) skipUntil = tag;
      continue;
    }

    if (!(tag in ALLOWED_TAGS)) continue;

    if (isClosing) {
      if (!VOID_TAGS.has(tag)) output += `</${tag}>`;
      continue;
    }

    const attributes = buildAttributes(tag, rawAttrs ?? "");
    output += VOID_TAGS.has(tag)
      ? `<${tag}${attributes} />`
      : `<${tag}${attributes}>`;
  }

  if (!skipUntil) output += html.slice(cursor);

  return output;
};

export default sanitizeHtml;
