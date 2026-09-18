export function orderAttachment(url: string) {
  try {
    const parsed = new URL(url, "https://attachment.invalid");
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const encodedName = parsed.pathname.split("/").pop() || "";
    let name = encodedName;
    try { name = decodeURIComponent(encodedName); } catch {}
    const extension = name.split(".").pop()?.toLowerCase();
    const type = ["jpg", "jpeg", "png", "gif", "webp", "avif"].includes(extension || "")
      ? "image" : extension === "pdf" ? "pdf" : "file";
    return { url, name, type };
  } catch {
    return null;
  }
}
