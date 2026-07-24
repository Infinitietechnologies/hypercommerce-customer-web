// Redesign atoms — the UI primitives every screen is built from.
//
// Pixel source: `HyperCommerce Foundations.dc.html` (buttons, inputs, chips,
// badges, cards) cross-checked against the live usages in
// `HyperCommerce App.dc.html`. Styles are inline on purpose: the design
// specifies exact px values (including half-pixels like 13.5), and inline
// styles keep this sandbox immune to the app's global Tailwind/HeroUI theme.
// Hover states live in `../redesign.css` under the `.rd` scope.

import type { CSSProperties, ReactNode } from "react";

import { Icon } from "@iconify/react";

import { grids, radius, shadow, v } from "../tokens";

/* -------------------------------------------------------------------------- */
/* Icon                                                                        */
/* -------------------------------------------------------------------------- */

export function RdIcon({
  icon,
  size = 20,
  color,
  style,
}: {
  icon: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <Icon
      icon={icon}
      style={{ fontSize: size, width: size, height: size, color, ...style }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Button                                                                      */
/* -------------------------------------------------------------------------- */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tinted"
  | "ghost"
  | "disabled";

const BUTTON_BASE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderRadius: radius.md,
  padding: "12px 22px",
  fontSize: 14,
  lineHeight: 1.2,
};

const BUTTON_VARIANTS: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: v.amber,
    color: v.onAmber,
    border: "none",
    fontWeight: 700,
    boxShadow: shadow.amber,
  },
  secondary: {
    background: v.surface,
    color: v.ink,
    border: `1px solid ${v.line}`,
    fontWeight: 600,
  },
  tinted: {
    background: v.amberTint,
    color: v.amberDark,
    border: "none",
    fontWeight: 700,
  },
  ghost: {
    background: "none",
    color: v.amberDark,
    border: "none",
    padding: "12px 8px",
    fontWeight: 700,
  },
  disabled: {
    background: v.line,
    color: v.inkSoft,
    border: "none",
    fontWeight: 600,
  },
};

export function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  style,
  fullWidth,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: string;
  onClick?: () => void;
  style?: CSSProperties;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={`rd-btn rd-btn-${variant}`}
      disabled={variant === "disabled"}
      style={{
        ...BUTTON_BASE,
        ...BUTTON_VARIANTS[variant],
        ...(fullWidth ? { width: "100%" } : null),
        ...style,
      }}
      type="button"
      onClick={onClick}
    >
      {icon ? <RdIcon icon={icon} size={18} /> : null}
      {children}
    </button>
  );
}

/** 44×44 bordered square button — the icon-only variant from Foundations. */
export function IconButton({
  icon,
  onClick,
  size = 44,
  iconSize = 20,
  style,
}: {
  icon: string;
  onClick?: () => void;
  size?: number;
  iconSize?: number;
  style?: CSSProperties;
}) {
  return (
    <button
      className="rd-btn rd-btn-secondary"
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        border: `1px solid ${v.line}`,
        background: v.surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
      type="button"
      onClick={onClick}
    >
      <RdIcon icon={icon} size={iconSize} />
    </button>
  );
}

/** Header nav item: stacked glyph + label, both amber on hover. */
export function HeaderIconButton({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: string;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <div
      className="rd-icon-btn"
      role="button"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        cursor: "pointer",
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <RdIcon color={v.ink} icon={icon} size={23} />
      {badge !== undefined ? (
        <span
          style={{
            position: "absolute",
            top: -5,
            right: -11,
            background: v.amber,
            color: v.onAmber,
            fontSize: 10,
            fontWeight: 700,
            borderRadius: radius.chip,
            minWidth: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
          }}
        >
          {badge}
        </span>
      ) : null}
      <span className="rd-icon-label" style={{ fontSize: 11, fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Inputs                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Static text input. The design is a prototype, so fields render as styled
 * placeholders rather than live `<input>`s — `focused` shows the focus ring.
 */
export function TextField({
  placeholder,
  icon,
  focused,
  style,
}: {
  placeholder: string;
  icon?: string;
  focused?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: v.surface,
        border: `1px solid ${focused ? v.amber : v.line}`,
        borderRadius: radius.md,
        padding: "12px 14px",
        fontSize: 13.5,
        color: focused ? v.ink : v.inkSoft,
        ...(focused ? { boxShadow: `0 0 0 3px ${v.amberTint}` } : null),
        ...style,
      }}
    >
      {icon ? <RdIcon color={v.inkSoft} icon={icon} size={18} /> : null}
      <span>{placeholder}</span>
    </div>
  );
}

/** Rounded 14px search box used by the header and the search screen. */
export function SearchField({
  placeholder,
  onClick,
  background = v.bg,
  style,
}: {
  placeholder: string;
  onClick?: () => void;
  background?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className="rd-field rd-search"
      role="button"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background,
        border: `1px solid ${v.line}`,
        borderRadius: radius.input,
        padding: "11px 16px",
        cursor: "text",
        ...style,
      }}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      <RdIcon color={v.inkSoft} icon="solar:magnifer-linear" size={18} />
      <span style={{ fontSize: 14, color: v.inkSoft }}>{placeholder}</span>
    </div>
  );
}

/** Square 6px-radius checkbox. */
export function Checkbox({
  checked,
  label,
  size = 20,
}: {
  checked?: boolean;
  label?: string;
  size?: number;
}) {
  const box = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: checked ? "none" : `2px solid ${v.line}`,
        background: checked ? v.amberDark : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {checked ? (
        <RdIcon color="#fff" icon="solar:check-read-linear" size={14} />
      ) : null}
    </div>
  );

  if (!label) return box;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {box}
      <span style={{ fontSize: 13.5 }}>{label}</span>
    </div>
  );
}

/** Circular radio dot. */
export function Radio({
  checked,
  label,
  size = 18,
  style,
}: {
  checked?: boolean;
  label?: string;
  size?: number;
  style?: CSSProperties;
}) {
  const dot = (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: `2px solid ${checked ? v.amberDark : v.line}`,
        background: checked ? v.amberDark : "transparent",
        flexShrink: 0,
        ...style,
      }}
    />
  );

  if (!label) return dot;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {dot}
      <span style={{ fontSize: 13.5 }}>{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Chips & badges                                                              */
/* -------------------------------------------------------------------------- */

export function Chip({
  children,
  selected,
  style,
}: {
  children: ReactNode;
  selected?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: 12.5,
        fontWeight: selected ? 700 : 600,
        padding: "8px 14px",
        borderRadius: radius.chip,
        border: selected ? "none" : `1px solid ${v.line}`,
        background: selected ? v.amberTint : v.surface,
        color: selected ? v.amberDark : v.inkSoft,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export type StatusTone = "delivered" | "shipped" | "cancelled";

const STATUS_TONES: Record<StatusTone, { bg: string; fg: string }> = {
  delivered: { bg: v.amberTint, fg: v.amberDark },
  shipped: { bg: "#eef2f6", fg: "#3a5a7a" },
  cancelled: { bg: "#fbe9e7", fg: v.danger },
};

export function statusTone(status: string): StatusTone {
  if (status === "Delivered") return "delivered";
  if (status === "Cancelled") return "cancelled";

  return "shipped";
}

export function StatusPill({ status }: { status: string }) {
  const tone = STATUS_TONES[statusTone(status)];

  return (
    <span
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: radius.chip,
        background: tone.bg,
        color: tone.fg,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

/** Solid amber discount flag, e.g. "50% off". */
export function DiscountBadge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        padding: "4px 9px",
        borderRadius: radius.badge,
        background: v.amber,
        color: v.onAmber,
      }}
    >
      {children}
    </span>
  );
}

/** Tinted rating badge — value plus a filled star. */
export function RatingBadge({ value }: { value: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12.5,
        fontWeight: 700,
        padding: "4px 9px",
        borderRadius: radius.badge,
        background: v.amberTint,
        color: v.amberDark,
      }}
    >
      {value}
      <RdIcon icon="solar:star-bold" size={12} />
    </span>
  );
}

/** Inline star + rating + review count, as used on product cards. */
export function RatingLine({
  rating,
  reviews,
}: {
  rating: string;
  reviews: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        marginBottom: 6,
      }}
    >
      <RdIcon color={v.amber} icon="solar:star-bold" size={14} />
      <span style={{ fontWeight: 600 }}>{rating}</span>
      <span style={{ color: v.inkSoft }}>({reviews})</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

/** Base content surface: 18px radius, hairline border, soft shadow. */
export function Card({
  children,
  padding = 18,
  style,
  className,
  onClick,
}: {
  children: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={className}
      style={{
        background: v.surface,
        border: `1px solid ${v.line}`,
        borderRadius: radius.card,
        padding,
        boxShadow: shadow.cardFlat,
        ...(onClick ? { cursor: "pointer" } : null),
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/**
 * Stand-in for the design's `<image-slot>`. Renders the same neutral tile with
 * a centred caption, so grids keep their exact aspect ratios without needing
 * real product photography.
 */
export function ImageSlot({
  label = "Photo",
  shape = "rect",
  style,
}: {
  label?: string;
  shape?: "rect" | "circle";
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 10,
        background: `linear-gradient(135deg, ${v.amberTint}, ${v.surface})`,
        color: v.inkSoft,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.3,
        overflow: "hidden",
        ...(shape === "circle" ? { borderRadius: "50%" } : null),
        ...style,
      }}
    >
      <span
        className="rd-clamp-2"
        style={{ maxWidth: "100%", wordBreak: "break-word" }}
      >
        {label}
      </span>
    </div>
  );
}

/** Section heading with an optional "See all →" affordance. */
export function SectionHeader({
  title,
  actionLabel = "See all →",
  onAction,
  color,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 19, fontWeight: 600, margin: 0, color }}>
        {title}
      </h2>
      {onAction ? (
        <button
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: color ?? v.amberDark,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/** Page title — 22/700, the heading used at the top of list screens. */
export function PageTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 18px", ...style }}>
      {children}
    </h1>
  );
}

/** Account-pane title — 19/700. */
export function PaneTitle({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <h1 style={{ fontSize: 19, fontWeight: 700, margin: "0 0 16px", ...style }}>
      {children}
    </h1>
  );
}

/** Horizontal rail — scrollbar-free flex row. */
export function Rail({
  children,
  gap = 16,
}: {
  children: ReactNode;
  gap?: number;
}) {
  return (
    <div
      className="rd-hscroll"
      style={{
        display: "flex",
        gap,
        overflowX: "auto",
        paddingBottom: 4,
      }}
    >
      {children}
    </div>
  );
}

/** Auto-fill grid. Pass a track from `grids`. */
export function Grid({
  children,
  columns = grids.product,
  gap = 16,
  style,
}: {
  children: ReactNode;
  columns?: string;
  gap?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Centred empty state: tinted icon tile, title, copy, optional action. */
export function EmptyState({
  icon,
  title,
  body,
  action,
  minHeight = "52vh",
}: {
  icon: string;
  title: string;
  body?: string;
  action?: ReactNode;
  minHeight?: string;
}) {
  return (
    <div
      style={{
        minHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 14,
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 24,
          background: v.amberTint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RdIcon color={v.amberDark} icon={icon} size={40} />
      </div>
      <div style={{ fontSize: 19, fontWeight: 600 }}>{title}</div>
      {body ? (
        <p
          style={{
            fontSize: 14,
            color: v.inkSoft,
            maxWidth: 380,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {body}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: 4 }}>{action}</div> : null}
    </div>
  );
}
