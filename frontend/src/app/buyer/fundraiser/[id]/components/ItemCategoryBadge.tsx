import type { ItemCategory } from "common";
import { cn } from "@/lib/utils";
import { itemCategoryInfo } from "@/lib/item-categories";

export function ItemCategoryBadge({
  category,
  size = "md",
  className,
}: {
  category: ItemCategory;
  size?: "sm" | "md";
  className?: string;
}) {
  const { label, icon: Icon } = itemCategoryInfo[category];

  return (
    <span
      className={cn(
        "flex w-fit items-center rounded-full bg-white font-medium text-black shadow-sm",
        size === "sm"
          ? "gap-1 px-2 py-0.5 text-xs"
          : "gap-1.5 px-3 py-1 text-sm",
        className,
      )}
    >
      <Icon
        className={cn(
          "text-[#265B34]",
          size === "sm" ? "h-3 w-3" : "h-4 w-4",
        )}
      />
      {label}
    </span>
  );
}
