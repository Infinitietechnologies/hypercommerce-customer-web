import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  Image,
} from "@/components/ui";
import { getFlagEmoji } from "@/helpers/getters";
import { ChevronDown } from "lucide-react";
import { changeLanguage } from "../../../i18n";

const languages = [
  {
    code: "en",
    countryCode: "us",
    name: "English",
    flag: "🇺🇸",
  },
  {
    code: "hi",
    countryCode: "in",
    name: "हिन्दी",
    flag: "🇮🇳",
  },
  {
    code: "ar",
    countryCode: "sa",
    name: "العربية",
    flag: "🇸🇦",
  },
];

interface LanguageSwitcherProps {
  variant?: "desktop" | "mobile";
}

const LanguageSwitcher = ({ variant = "desktop" }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  const getCurrentLanguage = () => {
    return (
      languages.find((lang) => lang.code === i18n.language) || languages[0]
    );
  };

  return (
    <Dropdown
      size="sm"
      classNames={{
        trigger: "h-8 min-w-0 p-0 data-[hover=true]:bg-inherit",
        base: "text-xs font-semibold",
        content: "min-w-4 text-xs",
      }}
    >
      <DropdownTrigger className="w-fit">
        <Button
          size="sm"
          variant="light"
          className={`flex h-8 min-w-0 items-center gap-1 text-xs font-semibold text-inherit transition-colors hover:text-(--header-active-color) ${variant === "mobile" ? "px-1" : "px-2"}`}
        >
          <div className="flex items-center gap-1">
            {variant === "desktop" ? (
              <Image
                src={getFlagEmoji(getCurrentLanguage().countryCode)}
                alt=""
                className="h-4 w-5 rounded-sm sm:hidden"
              />
            ) : null}
            <span className="inline">
              {getCurrentLanguage().code.charAt(0).toUpperCase() +
                getCurrentLanguage().code.slice(1)}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectionMode="single"
        selectedKeys={[i18n.language]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          if (selected) {
            changeLanguage(selected as string);
          }
        }}
      >
        {languages.map((language) => (
          <DropdownItem
            key={language.code}
            textValue={language.name}
            className="flex items-center gap-2"
            startContent={
              <Image
                src={getFlagEmoji(language.countryCode)}
                alt={`flag`}
                className="h-4 w-5 rounded-sm"
              />
            }
          >
            <span className={`fi fi-${language.countryCode} me-2`} />
            <span>{language.name}</span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
