// TODO: @STEVEN look over this again

import React from "react";

type ItemStat = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type ItemStatGridProps = {
  items: ItemStat[];
  maxItems?: number;
};

export default function ItemStatGrid({
  items,
  maxItems = 3,
}: ItemStatGridProps) {
  // Sort by quantity sold (highest first) and limit to maxItems
  const displayItems = [...items]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, maxItems);

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No items have been sold yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {displayItems.map((item) => (
        <div key={item.id} className="border rounded-lg overflow-hidden">
          <div className="p-2 text-center text-sm text-black bg-gray-300 truncate">
            {item.name}
          </div>
          <div className="p-4 bg-gray-100 text-center">
            <div className="text-3xl font-bold">{item.quantity}</div>
            <div className="text-xs text-black">Sold</div>
          </div>
        </div>
      ))}
    </div>
  );
}
