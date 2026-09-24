import { FC } from "react";
import { Image } from "@/components/ui";
import { ProductAttribute, SwatchValue } from "@/types/ApiResponse";

interface AttributeSelectorProps {
  attribute: ProductAttribute;
  selectedAttributes: Record<string, string>;
  onChange: (attributeSlug: string, value: string) => void;
}

const AttributeSelector: FC<AttributeSelectorProps> = ({
  attribute,
  selectedAttributes,
  onChange,
}) => {
  const { name, slug, swatche_type, swatch_values } = attribute;

  return (
    <div key={slug} className="space-y-2">
      <h4 className="text-xs font-medium text-default-600">
        {name}:{" "}
        <span className="font-semibold text-foreground">
          {selectedAttributes[slug]}
        </span>
      </h4>

      <div className="flex flex-wrap gap-2">
        {swatch_values.map((swatch: SwatchValue) => {
          const isSelected = selectedAttributes[slug] === swatch.value;

          if (swatche_type === "image") {
            return (
              <button
                type="button"
                key={swatch.value}
                aria-label={`${name}: ${swatch.value}`}
                aria-pressed={isSelected}
                onClick={() => onChange(slug, swatch.value)}
                className={`h-16 w-20 overflow-hidden rounded-small border bg-content1 transition-colors ${
                  isSelected
                    ? "border-primary"
                    : "border-divider hover:border-default-400"
                }`}
              >
                <Image
                  src={swatch.swatch}
                  alt={swatch.value}
                  removeWrapper
                  className="h-full w-full rounded-none object-contain p-1"
                />
              </button>
            );
          } else if (swatche_type == "color") {
            return (
              <button
                type="button"
                key={swatch.value}
                aria-label={`${name}: ${swatch.value}`}
                aria-pressed={isSelected}
                onClick={() => onChange(slug, swatch.value)}
                className={`flex items-center rounded-small border bg-content1 p-1 shadow-sm transition-colors ${
                  isSelected
                    ? "border-primary"
                    : "border-divider hover:border-default-400"
                }`}
              >
                {/* Color box */}
                <span
                  className="h-8 w-8 rounded-small shadow-sm ring-1 ring-inset ring-foreground/15"
                  style={{ backgroundColor: swatch.value }}
                />
              </button>
            );
          } else {
            return (
              <button
                type="button"
                key={swatch.value}
                aria-pressed={isSelected}
                onClick={() => onChange(slug, swatch.value)}
                className={`rounded-small border px-3 py-2 text-xs font-semibold transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-divider bg-content1 text-foreground hover:bg-content2"
                }`}
              >
                {swatch.value}
              </button>
            );
          }
        })}
      </div>
    </div>
  );
};

export default AttributeSelector;
