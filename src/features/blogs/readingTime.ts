export const estimateReadingMinutes = (html: string): number | null => {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, " ");
  const words = text.trim().match(/\S+/g)?.length ?? 0;
  return words ? Math.max(1, Math.ceil(words / 200)) : null;
};
