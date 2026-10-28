import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, Image } from "@/components/ui";
import type { SellerRegistrationField } from "@/types/seller";
import { IMAGE_TYPES, validateField } from "../fields";

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
  const { t } = useTranslation();
  const id = useId();
  const preview = useRef<HTMLImageElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const copy = (key: string) => t(`pages.sellerRegister.dynamic.${key}`);
  useEffect(() => {
    if (!file || validateField(field, file)) return;
    const url = URL.createObjectURL(file);
    if (preview.current) preview.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, field]);
  const message =
    (file && validateField(field, file) ? copy("image") : "") || error;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {field.label}{" "}
        {field.required ? (
          <span className="text-danger">*</span>
        ) : (
          `(${copy("optional")})`
        )}
      </label>
      <p id={`${id}-help`} className="text-xs text-foreground/60">
        {copy("imageHelp")}
      </p>
      {field.placeholder && (
        <p className="text-xs text-foreground/60">{field.placeholder}</p>
      )}
      {file && (
        <div className="flex min-w-0 items-center gap-3 rounded-medium border border-divider p-3">
          {!validateField(field, file) && (
            <Image
              removeWrapper
              disableSkeleton
              ref={preview}
              alt={file.name}
              className="h-12 w-12 rounded-small object-cover"
            />
          )}
          <span className="min-w-0 break-all text-sm">{file.name}</span>
          <Button
            size="sm"
            variant="light"
            onPress={() => {
              onChange();
              if (input.current) input.current.value = "";
            }}
            aria-label={`${t("pages.sellerRegister.button.removeFile")} ${field.label}`}
          >
            {t("pages.sellerRegister.button.removeFile")}
          </Button>
        </div>
      )}
      <Button
        size="sm"
        variant="bordered"
        className="w-full"
        aria-label={`${t(file ? "pages.sellerRegister.button.replaceFile" : "pages.sellerRegister.button.chooseFile")} ${field.label}`}
        aria-describedby={`${id}-help${message ? ` ${id}-error` : ""}`}
        onPress={() => input.current?.click()}
      >
        {t(
          file
            ? "pages.sellerRegister.button.replaceFile"
            : "pages.sellerRegister.button.chooseFile",
        )}
      </Button>
      <input
        ref={input}
        id={id}
        type="file"
        tabIndex={-1}
        accept={IMAGE_TYPES.join(",")}
        aria-required={field.required}
        aria-invalid={Boolean(message)}
        aria-describedby={`${id}-help${message ? ` ${id}-error` : ""}`}
        hidden
        onChange={(event) => {
          const selected = event.target.files?.[0];
          if (!selected) return;
          if (validateField(field, selected)) {
            onChange(selected);
            event.target.value = "";
            return;
          }
          onChange(selected);
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
