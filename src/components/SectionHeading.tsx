import React, { FC } from "react";

interface SectionHeadingProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

/**
 * Home/section heading — new amber redesign. Warm amber-tint icon chip, ink
 * title at the sandbox section-title scale (19/600), muted description.
 * (Source: /redesign primitives `SectionHeader`.)
 */
const SectionHeading: FC<SectionHeadingProps> = ({
  title,
  description,
  icon,
  color,
}) => {
  return (
    <div className="flex items-center gap-3">
      <div className="grid place-items-center p-2.5 rounded-large bg-primary-100 text-primary-600 shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <h2
          className="text-[17px] sm:text-[19px] font-semibold tracking-tight text-foreground leading-tight"
          style={{ color: color || undefined }}
        >
          {title}
        </h2>

        {description ? (
          <p
            className="text-xs text-default-500"
            style={{ color: color || undefined }}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default SectionHeading;
