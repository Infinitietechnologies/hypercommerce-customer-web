import type { CSSProperties, FC } from "react";

import { useCallback, useState } from "react";
import clsx from "clsx";

import { Skeleton } from "@/components/ui";

interface HomeResponsiveImageProps {
  alt: string;
  className?: string;
  desktopSrc: string;
  imageStyle?: CSSProperties;
  loading?: "eager" | "lazy";
  mobileSrc?: string | null;
  reserveBannerSpace?: boolean;
}

const HomeResponsiveImage: FC<HomeResponsiveImageProps> = ({
  alt,
  className,
  desktopSrc,
  imageStyle,
  loading = "lazy",
  mobileSrc,
  reserveBannerSpace = false,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const markLoaded = useCallback(() => setIsLoaded(true), []);

  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image) return;

      let active = true;
      setIsLoaded(false);

      const revealDecodedImage = () => {
        const decode = image.decode?.() ?? Promise.resolve();
        void decode
          .catch(() => undefined)
          .then(() => {
            if (active) markLoaded();
          });
      };

      const revealFailedImage = () => {
        if (active) markLoaded();
      };

      if (image.complete) {
        revealDecodedImage();
      } else {
        image.addEventListener("load", revealDecodedImage, { once: true });
        image.addEventListener("error", revealFailedImage, { once: true });
      }

      return () => {
        active = false;
        image.removeEventListener("load", revealDecodedImage);
        image.removeEventListener("error", revealFailedImage);
      };
    },
    [markLoaded],
  );

  const fallbackSrc = mobileSrc || desktopSrc;

  return (
    <div
      aria-busy={!isLoaded}
      className={clsx(
        "relative h-full w-full overflow-hidden",
        reserveBannerSpace &&
          !isLoaded &&
          "aspect-home-banner-mobile md:aspect-home-banner",
      )}
      data-home-image-loaded={isLoaded}
    >
      <Skeleton
        aria-hidden="true"
        className={clsx(
          "absolute inset-0 z-10 h-full w-full rounded-none transition-opacity duration-300 motion-reduce:transition-none",
          isLoaded ? "pointer-events-none opacity-0" : "opacity-100",
        )}
        data-home-image-skeleton
      />
      <picture className="block h-full w-full">
        {desktopSrc ? (
          <source media="(min-width: 769px)" srcSet={desktopSrc} />
        ) : null}
        <img
          key={`${desktopSrc}|${fallbackSrc}`}
          ref={imageRef}
          alt={alt}
          className={clsx(
            className,
            "transition-opacity duration-300 motion-reduce:transition-none",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
          decoding="async"
          fetchPriority={loading === "eager" ? "high" : "auto"}
          loading={loading}
          src={fallbackSrc}
          style={imageStyle}
        />
      </picture>
    </div>
  );
};

export default HomeResponsiveImage;
