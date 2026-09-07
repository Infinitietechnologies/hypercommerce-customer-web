export const DEFAULT_STORY_DURATION_MS = 5000;

export const getStoryDisplayDurationMs = (durationMs: number | null) =>
  durationMs && durationMs > 0 ? durationMs : DEFAULT_STORY_DURATION_MS;
