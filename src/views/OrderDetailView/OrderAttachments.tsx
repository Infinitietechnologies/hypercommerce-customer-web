import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Image, Link, Sheet } from "@/components/ui";
import { orderAttachment } from "./attachments";
import { Icon } from "@iconify/react";

export default function OrderAttachments({ attachments }: { attachments: string[] }) {
  const { t } = useTranslation();
  const files = attachments.map(orderAttachment).filter((file) => file !== null);
  const [preview, setPreview] = useState<ReturnType<typeof orderAttachment>>(null);
  if (!files.length) return null;

  return (
    <>
      <ul className="mt-2 flex flex-wrap gap-2">
        {files.map((file, index) => (
          <li key={`${file.url}-${index}`} className="flex max-w-full items-center gap-2 rounded-medium border border-divider p-2 text-xs">
            {file.type === "image" ? <Image src={file.url} alt={file.name} removeWrapper className="h-10 w-10 shrink-0 rounded-small object-cover" />
              : <Icon icon="solar:document-text-linear" className="h-10 w-10 shrink-0 rounded-small bg-default-100 p-2 text-default-500" />}
            <div className="min-w-0 max-w-48">
              <p className="truncate font-medium" title={file.name}>{file.name || t("attachments")}</p>
              {file.type !== "file" ? <Button size="sm" variant="light" className="h-6 min-w-0 px-0 text-xs" onPress={() => setPreview(file)}>
                {t("orderAttachments.preview", "Preview")}
              </Button> : <Link href={file.url} target="_blank" rel="noopener noreferrer" size="sm">{t("orderAttachments.open", "Open or download")}</Link>}
            </div>
          </li>
        ))}
      </ul>
      <Sheet isOpen={preview !== null} onClose={() => setPreview(null)} title={preview?.name || t("attachments")} size="lg">
        {preview && (
          <div className="space-y-3">
            <Link href={preview.url} target="_blank" rel="noopener noreferrer">
              {t("orderAttachments.open", "Open or download")}
            </Link>
            {preview.type === "image" ? (
              <Image src={preview.url} alt={preview.name} className="h-auto max-h-screen w-full object-contain" />
            ) : (
              <>
                <p className="text-xs text-default-500">{t("orderAttachments.pdfHint", "If the preview is unavailable, open or download the file above.")}</p>
                <iframe src={preview.url} title={preview.name} className="h-96 w-full rounded-medium border border-divider" />
              </>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
