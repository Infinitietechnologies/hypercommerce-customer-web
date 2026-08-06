export const MAX_IMAGE_SIZE_MB = 5;

/**
 * An explicit list rather than a `image/` prefix test: the prefix admits
 * `image/svg+xml`, which is a script-carrying document once a host serves it.
 */
const IMAGE_MIME_ALLOWLIST = [
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
];

export type ImageRejection = "type" | "size";

/**
 * Reject reason for an image the user picked, or null when it passes. The
 * `accept` attribute on a file input is a picker hint — this is the check.
 */
export const rejectImage = (
  file: File,
  maxSizeMB: number = MAX_IMAGE_SIZE_MB
): ImageRejection | null => {
  if (!IMAGE_MIME_ALLOWLIST.includes(file.type.toLowerCase())) return "type";
  if (file.size > maxSizeMB * 1024 * 1024) return "size";

  return null;
};

/** Translation keys for a rejection, matching the pair used by both callers. */
export const imageRejectionKeys = (rejection: ImageRejection) =>
  rejection === "type"
    ? { title: "invalid_file_type", description: "only_images_allowed" }
    : { title: "file_too_large", description: "image_size_limit_5mb" };
