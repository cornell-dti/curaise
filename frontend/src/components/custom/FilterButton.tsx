"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Filter } from "lucide-react";
import { useRouter } from "next/navigation";

interface FilterButtonProps {
  paymentTypes: string[];
  itemOptions: { id: string; name: string }[];
  orderStatuses: string[];
  activeFilters: {
    paymentType: string[];
    items: string[];
    status: string[];
  };
  currentParams: Record<string, string | string[] | undefined>;
}

export function FilterButton({
  paymentTypes,
  itemOptions,
  orderStatuses,
  activeFilters,
  currentParams,
}: FilterButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(activeFilters);

  const totalActiveFilters =
    selectedFilters.paymentType.length +
    selectedFilters.items.length +
    selectedFilters.status.length;

  const applyFilters = () => {
    const searchParams = new URLSearchParams();
    
    // Preserve existing non-filter search params
    Object.entries(currentParams).forEach(([key, value]) => {
      if (!['paymentType', 'items', 'status'].includes(key) && value) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    // Add filter params
    selectedFilters.paymentType.forEach(type => {
      searchParams.append('paymentType', type);
    });
    
    selectedFilters.items.forEach(item => {
      searchParams.append('items', item);
    });
    
    selectedFilters.status.forEach(status => {
      searchParams.append('status', status);
    });

    router.push(`?${searchParams.toString()}`);
    setOpen(false);
  };

  const clearFilters = () => {
    setSelectedFilters({
      paymentType: [],
      items: [],
      status: [],
    });
  };

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters(prev => {
      const updated = { ...prev };
      if (updated[category].includes(value)) {
        updated[category] = updated[category].filter(v => v !== value);
      } else {
        updated[category] = [...updated[category], value];
      }
      return updated;
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 px-4">
          <span>Filter</span>
          <Filter className="h-4 w-4" />
          {totalActiveFilters > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 rounded-sm px-1 font-normal"
            >
              {totalActiveFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4" align="end">
        <div className="max-h-[400px] overflow-y-auto pr-2">
          {/* Payment Type Section */}
          <div className="mb-4">
            <h3 className="font-medium text-sm mb-2 text-muted-foreground">Payment Type</h3>
            <div className="space-y-2">
              {paymentTypes.map((type) => (
                <div
                  key={type}
                  className="flex items-center space-x-2 rounded-md p-1"
                >
                  <Checkbox
                    id={`payment-${type}`}
                    checked={selectedFilters.paymentType.includes(type)}
                    onChange={() => toggleFilter("paymentType", type)}
                  />
                  <Label
                    htmlFor={`payment-${type}`}
                    className="flex flex-1 cursor-pointer select-none items-center justify-between"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Order Status Section */}
          <div className="mb-4">
            <h3 className="font-medium text-sm mb-2 text-muted-foreground">Order Status</h3>
            <div className="space-y-2">
              {orderStatuses.map((status) => (
                <div
                  key={status}
                  className="flex items-center space-x-2 rounded-md p-1"
                >
                  <Checkbox
                    id={`status-${status}`}
                    checked={selectedFilters.status.includes(status)}
                    onChange={() => toggleFilter("status", status)}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className="flex flex-1 cursor-pointer select-none items-center justify-between"
                  >
                    {status}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-4">
            <h3 className="font-medium text-sm mb-2 text-muted-foreground">Items</h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {itemOptions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2 rounded-md p-1"
                >
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={selectedFilters.items.includes(item.id)}
                    onChange={() => toggleFilter("items", item.id)}
                  />
                  <Label
                    htmlFor={`item-${item.id}`}
                    className="flex flex-1 cursor-pointer select-none items-center justify-between text-sm"
                  >
                    {item.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
          <Button size="sm" onClick={applyFilters}>
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
