/**
 * Resolve a `?next=` value to a redirect target.
 *
 * Only same-origin absolute paths are allowed. Anything else — a full URL, a
 * protocol-relative `//evil.com`, a missing value — falls back to the home
 * page, so the parameter cannot be used as an open redirect.
 */
export const safeNext = (value: unknown): string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
