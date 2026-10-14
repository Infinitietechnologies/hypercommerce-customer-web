import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  EmailIcon,
  FacebookIcon,
  LinkedinIcon,
  TelegramIcon,
  WhatsappIcon,
  XIcon,
} from "react-share";

import { Sheet } from "@/components/ui";

interface BlogShareSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  image: string | null;
  url: string;
}

const BlogShareSheet = ({ isOpen, onOpenChange, title, image, url }: BlogShareSheetProps) => {
  const { t } = useTranslation();
  const message = `${title}\n${url}`;
  const options = [
    { id: "whatsapp", label: t("blogs.shareWhatsapp"), icon: <WhatsappIcon size={46} round />, href: `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}` },
    { id: "telegram", label: t("blogs.shareTelegram"), icon: <TelegramIcon size={46} round />, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { id: "facebook", label: t("blogs.shareFacebook"), icon: <FacebookIcon size={46} round />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { id: "x", label: t("blogs.shareX"), icon: <XIcon size={46} round />, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}` },
    { id: "linkedin", label: t("blogs.shareLinkedin"), icon: <LinkedinIcon size={46} round />, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { id: "email", label: t("blogs.shareEmail"), icon: <EmailIcon size={46} round />, href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}` },
  ];

  return (
    <Sheet isOpen={isOpen} onOpenChange={onOpenChange} title={t("blogs.share")}
      size="md" classNames={{ closeButton: "text-base p-2 top-3 end-3 hover:bg-default-100 rounded-medium text-default-500 hover:text-foreground" }}>
      <div className="pb-3">
        <div className="mb-6 flex items-center gap-4 rounded-large bg-content2 p-3">
          {image ? <span className="relative size-20 shrink-0 overflow-hidden rounded-medium"><Image unoptimized fill alt="" src={image} sizes="80px" className="object-cover" /></span> : null}
          <p className="line-clamp-3 text-sm font-semibold leading-6 text-foreground">{title}</p>
        </div>
        <p className="mb-4 text-sm text-default-600">{t("blogs.shareDescription")}</p>
        <div className="grid grid-cols-3 gap-3">
          {options.map((option) => (
            <a key={option.id} href={option.href} target={option.id === "email" ? undefined : "_blank"}
              rel={option.id === "email" ? undefined : "noopener noreferrer"}
              onClick={() => onOpenChange(false)}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-medium px-1 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-content2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
              {option.icon}
              <span className="text-center">{option.label}</span>
            </a>
          ))}
        </div>
      </div>
    </Sheet>
  );
};

export default BlogShareSheet;
