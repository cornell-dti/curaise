"use client";

import { useState } from "react";
import {
  Lollipop,
  Utensils,
  Scissors,
  CupSoda,
  ChevronDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CategoryType } from "./browse-utils";

const categories = [
  { id: "desserts" as CategoryType, label: "Desserts", icon: Lollipop },
  { id: "food" as CategoryType, label: "Food", icon: Utensils },
  { id: "crafts" as CategoryType, label: "Crafts", icon: Scissors },
  { id: "drinks" as CategoryType, label: "Drinks", icon: CupSoda },
];

export function FilterBar({
  category,
  onCategoryChange,
}: {
  category: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
}) {
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      <div className="flex flex-col gap-3 w-full">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`h-[38px] rounded-full px-4 py-2 flex items-center justify-center gap-2 border transition-colors flex-shrink-0 ${isActive
                ? "bg-black border-black text-[#FEFDFD]"
                : "bg-white border-[#dddddd] text-black"
                }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-base font-normal leading-6">
                {cat.label}
              </span>
            </button>
          );
        })}

        {/* Sort By Dropdown */}
        <div className="flex gap-3 items-center">
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <button className="flex h-[31px] items-center gap-[10px] rounded-[6px] border border-[#265B34] bg-white px-3 py-1 text-[14px] font-semibold leading-[21px] text-[#265B34]">
                Filter
                <ChevronDown className="size-[13px]" />
              </button>
            </PopoverTrigger>

            <PopoverContent className="w-full p-0" align="start">
              <div className="p-3 flex flex-col gap-3">
                <div className="flex flex-row justify-between md:px-[12px] md:gap-2">
                  <p>Clubs</p>
                  <button>
                    Clear All
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
