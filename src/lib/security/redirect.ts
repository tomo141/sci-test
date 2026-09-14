/** Only relative, same-origin application destinations may follow authentication. */
export function safeAuthRedirect(value: string | null | undefined, origin: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) {
    return "/mypage";
  }
  try {
    const destination = new URL(value, origin);
    if (destination.origin !== new URL(origin).origin) return "/mypage";
    const decoded = decodeURIComponent(destination.pathname);
    if (decoded.startsWith("//") || decoded.includes("\\")) return "/mypage";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/mypage";
  }
}
