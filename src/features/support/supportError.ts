export function supportErrorMessage(error: unknown, fallback: string, rateLimited?: (seconds: number) => string): string {
  if (typeof error === "object" && error && "response" in error) {
    const response = (error as { response?: { status?: number; headers?: Record<string, unknown>; data?: { message?: unknown } } }).response;
    if (response?.status === 429 && rateLimited) {
      const seconds = Number(response.headers?.["retry-after"]);
      return rateLimited(Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60);
    }
    if (typeof response?.data?.message === "string") return response.data.message;
  }
  return fallback;
}
