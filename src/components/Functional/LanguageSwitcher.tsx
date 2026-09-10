import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@/components/ui";
import { ChevronDown } from "lucide-react";
import { useLanguages } from "@/contexts/LanguageContext";

interface LanguageSwitcherProps {
  variant?: "desktop" | "mobile";
}

const LanguageSwitcher = ({ variant = "desktop" }: LanguageSwitcherProps) => {
  const { languages, currentLanguage, isLoading, selectLanguage } =
    useLanguages();

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
          isDisabled={isLoading}
          className={`flex h-8 min-w-0 items-center gap-1 text-xs font-semibold text-inherit transition-colors hover:text-(--header-active-color) ${variant === "mobile" ? "px-1" : "px-2"}`}
        >
          <div className="flex items-center gap-1">
            <span className="inline">{currentLanguage.code.toUpperCase()}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        selectionMode="single"
        selectedKeys={[currentLanguage.code]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0];
          if (selected) {
            void selectLanguage(String(selected));
          }
        }}
      >
        {languages.map((language) => (
          <DropdownItem
            key={language.code}
            textValue={language.native_name}
            className="flex items-center gap-2"
          >
            <span>{language.native_name}</span>
            <span className="text-foreground/50">
              {language.code.toUpperCase()}
            </span>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
