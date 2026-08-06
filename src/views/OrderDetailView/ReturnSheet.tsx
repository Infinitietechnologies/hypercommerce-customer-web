import type { OrderItem } from "@/types/ApiResponse";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@iconify/react";

import {
  Button,
  Select,
  SelectItem,
  Sheet,
  Textarea,
  toastError,
  toastSuccess,
} from "@/components/ui";
import { useSettings } from "@/contexts/SettingsContext";
import { imageRejectionKeys, rejectImage } from "@/helpers/imageUpload";
import { returnOrderItem } from "@/services/orders";

/** Reasons that require a written remark + at least one photo (backend enforces). */
const EVIDENCE_REQUIRED = new Set([
  "damaged",
  "defective",
  "wrong_item",
  "not_as_described",
]);

interface ReturnSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: OrderItem;
  onDone?: () => void;
}

const ReturnSheet: React.FC<ReturnSheetProps> = ({
  isOpen,
  onClose,
  item,
  onDone,
}) => {
  const { t } = useTranslation();
  const { systemSettings } = useSettings();

  const reasons = useMemo(
    () => Object.entries(systemSettings?.returnReasonEnum ?? {}),
    [systemSettings?.returnReasonEnum],
  );

  const [reasonCode, setReasonCode] = useState("");
  const [remark, setRemark] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const needsEvidence = EVIDENCE_REQUIRED.has(reasonCode);

  const reset = () => {
    setReasonCode("");
    setRemark("");
    setImages([]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const onFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const accepted = files.filter((file) => {
      const rejection = rejectImage(file);

      if (rejection) {
        const keys = imageRejectionKeys(rejection);
        toastError(t(keys.title), t(keys.description));
      }

      return !rejection;
    });

    setImages((prev) => [...prev, ...accepted].slice(0, 5));
    e.target.value = "";
  };

  const submit = async () => {
    if (!reasonCode) {
      toastError(t("pages.order.selectReason", "Please select a return reason."));
      return;
    }
    if (needsEvidence && !remark.trim()) {
      toastError(t("pages.order.remarkRequired", "Please describe the problem."));
      return;
    }
    if (needsEvidence && images.length === 0) {
      toastError(t("pages.order.photoRequired", "Please attach at least one photo."));
      return;
    }

    try {
      setSubmitting(true);
      const res = await returnOrderItem({
        orderItemId: String(item.id),
        reason_code: reasonCode,
        reason: remark.trim() || undefined,
        images: images.length ? images : undefined,
      });
      if (res.success) {
        toastSuccess(res.message || t("pages.order.returnRequested", "Return requested"));
        close();
        onDone?.();
      } else {
        toastError(res.message || t("cancel_item_failed", "Something went wrong"));
      }
    } catch {
      toastError(t("cancel_item_failed", "Something went wrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={close}
      title={t("return")}
      size="lg"
      footer={
        <div className="flex w-full gap-2">
          <Button variant="bordered" className="flex-1" onPress={close}>
            {t("close")}
          </Button>
          <Button
            color="primary"
            className="flex-1"
            onPress={submit}
            isLoading={submitting}
          >
            {t("pages.order.requestReturn", "Request return")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="text-sm text-default-500 line-clamp-2">
          {item.product?.name || item.title}
        </div>

        <Select
          label={t("pages.order.returnReason", "Return reason")}
          labelPlacement="outside"
          placeholder={t("pages.order.selectReason", "Select a reason")}
          selectedKeys={reasonCode ? [reasonCode] : []}
          onChange={(e) => setReasonCode(e.target.value)}
          isRequired
        >
          {reasons.map(([code, label]) => (
            <SelectItem key={code} textValue={label}>
              {label}
            </SelectItem>
          ))}
        </Select>

        <Textarea
          label={t("pages.order.remark", "Remark")}
          labelPlacement="outside"
          placeholder={t("pages.order.remarkPlaceholder", "Describe the problem")}
          value={remark}
          onValueChange={setRemark}
          isRequired={needsEvidence}
          minRows={2}
        />

        <div>
          <div className="mb-1.5 text-sm font-medium">
            {t("pages.order.photos", "Photos")}
            {needsEvidence && <span className="text-danger"> *</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {images.map((f, i) => (
              <div
                key={i}
                className="relative h-16 w-16 overflow-hidden rounded-medium border border-divider"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(f)}
                  alt={`return-${i}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-content1/90 text-danger"
                  aria-label={t("delete")}
                >
                  <Icon icon="solar:close-circle-bold" width={16} height={16} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-medium border border-dashed border-divider text-default-500 hover:border-primary">
                <Icon icon="solar:camera-add-linear" width={20} height={20} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onFiles}
                />
              </label>
            )}
          </div>
          {needsEvidence && (
            <p className="mt-1 text-xs text-default-500">
              {t(
                "pages.order.evidenceHint",
                "This reason needs a remark and at least one photo.",
              )}
            </p>
          )}
        </div>
      </div>
    </Sheet>
  );
};

export default ReturnSheet;
