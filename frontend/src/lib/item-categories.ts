import { ItemCategorySchema, type ItemCategory } from "common";
import {
  CupSoda,
  Ellipsis,
  Hamburger,
  Lollipop,
  Shirt,
  type LucideIcon,
} from "lucide-react";

export const itemCategoryInfo: Record<
  ItemCategory,
  { label: string; icon: LucideIcon }
> = {
  DESSERTS: { label: "Desserts", icon: Lollipop },
  FOOD: { label: "Food", icon: Hamburger },
  DRINKS: { label: "Drinks", icon: CupSoda },
  APPAREL: { label: "Apparel", icon: Shirt },
  OTHER: { label: "Others", icon: Ellipsis },
};

export const itemCategories = ItemCategorySchema.options.map((id) => ({
  id,
  ...itemCategoryInfo[id],
}));
