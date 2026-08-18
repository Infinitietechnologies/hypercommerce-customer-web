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
                key={swatch.value}
                onClick={() => onChange(slug, swatch.value)}
                className={`h-9 w-9 overflow-hidden rounded-small border transition-colors ${
                  isSelected
                    ? "border-primary"
                    : "border-divider hover:border-default-400"
                }`}
              >
                <Image
                  src={swatch.swatch}
                  alt={swatch.value}
                  className="w-full h-full object-fill rounded-none"
                  classNames={{ wrapper: "h-full w-full" }}
                />
              </button>
            );
          } else if (swatche_type == "color") {
            return (
              <button
                key={swatch.value}
                onClick={() => onChange(slug, swatch.value)}
                className={`flex items-center rounded-small border p-0 transition-colors ${
                  isSelected
                    ? "border-primary"
                    : "border-divider hover:border-default-400"
                }`}
              >
                {/* Color box */}
                <span
                  className="h-8 w-8 rounded-small"
                  style={{ backgroundColor: swatch.value }}
                />
              </button>
            );
          } else {
            return (
              <button
                key={swatch.value}
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
