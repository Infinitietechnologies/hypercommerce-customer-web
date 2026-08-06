import { FC, useRef, useState } from "react";
import { Input, Kbd } from "@/components/ui";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export interface SearchSuggestion {
  /** Iconify id, e.g. `solar:running-round-linear`. */
  icon?: string;
  label: string;
  /** Right-aligned context line, e.g. "in Footwear". */
  meta?: string;
}

interface SearchBarProps {
  onSearch?: (term: string) => void;
  /** Recent search terms — owned by the caller (view/layout), not fetched here. */
  recent?: string[];
  onClearRecent?: () => void;
  suggestions?: SearchSuggestion[];
}

/**
 * Expanding search field with a recent-searches + suggestions dropdown.
 * Ported from the amber redesign handoff (`src/components/SearchBar.jsx`).
 * Collapses to a compact width; expands on focus with an animated dropdown.
 *
 * Presentational only — `recent`/`suggestions` come in as props so the
 * component never fetches (see components/CLAUDE.md contract).
 */
const SearchBar: FC<SearchBarProps> = ({
  onSearch,
  recent = [],
  onClearRecent,
  suggestions = [],
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close when focus leaves the whole widget (input + dropdown).
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
  };

  const submit = (q?: string) => {
    const term = (q ?? value).trim();
    if (!term) return;
    onSearch?.(term);
    setValue(term);
    setOpen(false);
  };

  const filtered = value
    ? suggestions.filter((s) =>
        s.label.toLowerCase().includes(value.toLowerCase()),
      )
    : suggestions;

  return (
    <div ref={wrapRef} onBlur={handleBlur} className="relative flex-1 min-w-0">
      <motion.div
        animate={{ scale: open ? 1 : 0.995 }}
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
      >
        <Input
          aria-label={t("search_products")}
          value={value}
          onValueChange={setValue}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("search_placeholder")}
          radius="lg"
          variant="flat"
          startContent={
            <Icon
              icon="solar:magnifer-linear"
              className="text-default-500 text-xl shrink-0"
            />
          }
          endContent={
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => submit()}
              className="bg-primary text-primary-foreground font-extrabold text-sm rounded-lg px-5 py-2 -me-1 transition-transform active:scale-95"
            >
              {t("search")}
            </button>
          }
          classNames={{
            inputWrapper:
              "bg-content2 border border-divider h-12 pe-1 data-[focus=true]:border-primary data-[hover=true]:border-primary/60",
            input: "text-sm font-medium",
          }}
        />
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl bg-content1 border border-divider shadow-xl overflow-hidden"
          >
            {!value && recent.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between px-2 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-default-500">
                    {t("recent")}
                  </span>
                  {onClearRecent && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={onClearRecent}
                      className="text-xs font-bold text-primary-600"
                    >
                      {t("clear")}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 px-1">
                  {recent.map((r) => (
                    <button
                      key={r}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => submit(r)}
                      className="flex items-center gap-1.5 text-sm font-medium rounded-full bg-content2 border border-divider px-3 py-1.5 hover:border-primary transition-colors"
                    >
                      <Icon
                        icon="solar:history-linear"
                        className="text-default-400 text-base"
                      />
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="border-t border-divider py-2">
                <div className="px-4 py-1 text-xs font-extrabold uppercase tracking-wider text-default-500">
                  {value ? t("suggestions") : t("trending")}
                </div>
                {filtered.map((s) => (
                  <button
                    key={s.label}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => submit(s.label)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-content2 transition-colors"
                  >
                    {s.icon && (
                      <Icon
                        icon={s.icon}
                        className="text-default-500 text-xl shrink-0"
                      />
                    )}
                    <span className="text-sm font-medium flex-1">{s.label}</span>
                    {s.meta && (
                      <span className="text-xs text-default-400">{s.meta}</span>
                    )}
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-4 py-3 text-sm text-default-400">
                    {t("no_matches_press_enter")}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-1.5 px-4 py-2 border-t border-divider text-xs text-default-400">
              <Kbd keys={["enter"]}>Enter</Kbd> {t("to_search")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
