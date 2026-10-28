import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";
import { Button, Image } from "@/components/ui";
import type { SellerRegistrationField } from "@/types/seller";
import { IMAGE_TYPES, validateField } from "../fields";

function DocumentPreview({ file, valid }: { file: File; valid: boolean }) {
  const [preview, setPreview] = useState<{ file: File; url: string }>();
  useEffect(() => {
    if (!valid) return;
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => setPreview({ file, url });
    image.src = url;
    return () => {
      image.onload = null;
      image.src = "";
      URL.revokeObjectURL(url);
    };
  }, [file, valid]);
  const url = preview?.file === file ? preview.url : undefined;
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-medium border border-divider bg-default-50 sm:h-24 sm:w-24">
      {url ? (
        <Image
          src={url}
          alt={file.name}
          removeWrapper
          disableSkeleton
          className="h-full w-full object-contain"
        />
      ) : (
        <Icon
          icon="solar:gallery-linear"
          className="h-8 w-8 text-default-400"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function SellerFieldUpload({
  field,
  file,
  error,
  onChange,
}: {
  field: SellerRegistrationField;
  file?: File;
  error?: string;
  onChange: (file?: File) => void;
}) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const copy = (key: string) => t(`pages.sellerRegister.dynamic.${key}`);
  const valid = file ? !validateField(field, file) : false;
  const message = (file && !valid ? copy("image") : "") || error;
  const describedBy = `${id}-help${message ? ` ${id}-error` : ""}`;
  const choose = () => input.current?.click();

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {field.label}{" "}
        {field.required ? (
          <span className="text-danger">*</span>
        ) : (
          <span className="font-normal text-foreground/60">
            ({copy("optional")})
          </span>
        )}
      </label>
      {field.placeholder && (
        <p className="text-xs text-foreground/60">{field.placeholder}</p>
      )}
      {file ? (
        <div
          className={`flex min-w-0 flex-col gap-4 rounded-large border bg-content1 p-4 ${message ? "border-danger" : "border-divider"}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <DocumentPreview file={file} valid={valid} />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-semibold [overflow-wrap:anywhere]">
                {file.name}
              </p>
              <p className="mt-1 text-xs text-foreground/60">
                {t("pages.sellerRegister.dynamic.fileSize", {
                  size: new Intl.NumberFormat(i18n.resolvedLanguage || "en", {
                    maximumFractionDigits: 1,
                  }).format(file.size / 1024),
                })}
              </p>
              {valid && (
                <p className="mt-2 flex items-center gap-1 text-xs text-success">
                  <Icon
                    icon="solar:check-circle-linear"
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {copy("readyToUpload")}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="bordered"
              className="min-w-0 gap-1.5 px-3 text-sm"
              startContent={
                <Icon
                  icon="solar:refresh-linear"
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              }
              aria-label={`${copy("replace")} ${field.label}`}
              aria-describedby={describedBy}
              onPress={choose}
            >
              {copy("replace")}
            </Button>
            <Button
              size="sm"
              variant="light"
              color="danger"
              className="min-w-0 gap-1.5 px-3 text-sm"
              startContent={
                <Icon
                  icon="solar:trash-bin-trash-linear"
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              }
              aria-label={`${copy("remove")} ${field.label}`}
              onPress={() => {
                onChange();
                if (input.current) input.current.value = "";
              }}
            >
              {copy("remove")}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className={`flex min-h-40 w-full sm:min-h-44 flex-col items-center justify-center gap-3 rounded-large border border-dashed bg-default-50 p-4 text-center transition-colors hover:border-primary hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${message ? "border-danger" : "border-default-300"}`}
          aria-label={`${copy("chooseImage")} ${field.label}`}
          aria-describedby={describedBy}
          onClick={choose}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-divider bg-content1">
            <Icon
              icon="solar:cloud-upload-linear"
              className="h-5 w-5 text-foreground/70"
              aria-hidden="true"
            />
          </span>
          <span className="text-sm font-semibold">{copy("chooseImage")}</span>
        </button>
      )}
      <p
        id={`${id}-help`}
        className="text-xs leading-relaxed text-foreground/60"
      >
        {copy("imageHelp")}
      </p>
      <input
        ref={input}
        id={id}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        hidden
        aria-required={field.required}
        aria-invalid={Boolean(message)}
        aria-describedby={describedBy}
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;
          onChange(selected);
          event.target.value = "";
        }}
      />
      {message && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {message}
        </p>
      )}
    </div>
  );
}
