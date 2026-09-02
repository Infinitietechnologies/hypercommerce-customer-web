import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

type Props = { enabled: boolean; onFiles: (files: File[]) => void; children: ReactNode };

export default function SupportDropZone({ enabled, onFiles, children }: Props) {
  const { t } = useTranslation();
  const depth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const reset = () => { depth.current = 0; setDragging(false); };

  useEffect(() => {
    window.addEventListener("dragend", reset);
    window.addEventListener("drop", reset);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("dragend", reset);
      window.removeEventListener("drop", reset);
      window.removeEventListener("blur", reset);
    };
  }, []);

  // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- File-drop enhancement; the existing file picker provides keyboard and touch access.
  return <div className="relative h-full" role="region" aria-label={t("supportChat.dropMedia")}
    onDragEnter={(event) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      depth.current += 1;
      if (enabled) setDragging(true);
    }}
    onDragOver={(event) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = enabled ? "copy" : "none";
    }}
    onDragLeave={() => { depth.current = Math.max(0, depth.current - 1); if (!depth.current) setDragging(false); }}
    onDrop={(event) => {
      if (!event.dataTransfer.types.includes("Files")) return;
      event.preventDefault();
      reset();
      if (enabled) onFiles(Array.from(event.dataTransfer.files));
    }}>
    {children}
    {dragging && enabled ? <div className="pointer-events-none absolute inset-2 z-20 grid place-items-center rounded-xl border-2 border-dashed border-primary bg-content1/95 p-5 text-center text-primary" role="status">
      <div><Icon icon="solar:upload-linear" width={32} className="mx-auto mb-2" /><p className="font-semibold">{t("supportChat.dropMedia")}</p><p className="mt-1 text-xs text-default-500">{t("supportChat.attachmentError")}</p></div>
    </div> : null}
  </div>;
}
