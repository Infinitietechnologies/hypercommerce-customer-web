export function createLandingDocument(
  html: string,
  css: string,
  assetBaseUrl: string,
  pageUrl: string,
): string {
  const document = new DOMParser().parseFromString(html, "text/html");

  if (!document.querySelector("meta[charset]")) {
    const charset = document.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    document.head.prepend(charset);
  }

  if (!document.querySelector('meta[name="viewport"]')) {
    const viewport = document.createElement("meta");
    viewport.name = "viewport";
    viewport.content = "width=device-width, initial-scale=1";
    document.head.append(viewport);
  }

  if (!document.querySelector("base[href]")) {
    const base = document.createElement("base");
    base.href = new URL(assetBaseUrl || "/", pageUrl).href;
    document.head.prepend(base);
  }

  const style = document.createElement("style");
  style.textContent = css.replace(/<\/style/gi, "<\\/style");
  document.head.append(style);

  const navigation = document.createElement("script");
  const navigationBase = JSON.stringify(pageUrl).replace(/</g, "\\u003c");
  navigation.textContent = `
window.addEventListener("click", function (event) {
  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  var link = event.target.closest && event.target.closest("a[href]");
  if (!link || link.hasAttribute("download")) return;
  var href = link.getAttribute("href");
  var linkTarget = link.getAttribute("target");
  if (href.charAt(0) === "#" && (!linkTarget || linkTarget === "_self")) {
    event.preventDefault();
    var id;
    try { id = decodeURIComponent(href.slice(1)); } catch (_) { return; }
    var target = document.getElementById(id) || document.getElementsByName(id)[0];
    if (target) target.scrollIntoView();
    else if (!id) window.scrollTo(0, 0);
    return;
  }
  var url = new URL(href, ${navigationBase});
  if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:") {
    link.href = url.href;
    if (!linkTarget) link.target = "_top";
  }
});`;
  document.head.prepend(navigation);

  return `<!doctype html>\n${document.documentElement.outerHTML}`;
}
