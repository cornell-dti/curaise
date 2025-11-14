"use client";

import { ReactNode, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Image,
  PencilLine,
  ShoppingBag,
  CircleDollarSign,
  SendHorizontal,
  MoveRight,
  ShoppingCart,
  Upload,
} from "lucide-react";
import {
  CompleteFundraiserSchema,
  CompleteItemSchema,
  CreateFundraiserItemBody,
} from "common";
import { z } from "zod";
import { Button } from "@/components/ui/button";

const checkListData = [
  {
    key: "imageUrls",
    name: "Add a storefront banner",
    description:
      "The banner for your fundraiser will be displayed to other students. This banner is required to publish your fundraiser.",
    icon: <Image className="stroke-[#265B34]" strokeWidth={2} size={30} />,
    button: "Add Image",
    step: 0,
    completed: false,
  },
  {
    key: "description",
    name: "Add a description",
    description:
      "The description for your fundraiser explains what cause the fundraiser is supporting. The description is required to publish your fundraiser.",
    icon: <PencilLine className="stroke-[#265B34]" strokeWidth={2} size={30} />,
    button: "Add Description",
    step: 0,
    completed: false,
  },
  {
    key: "venmoInfo",
    name: "Add Venmo information",
    description:
      "The Venmo information specifies who buyers should pay to purchase their items. This is required to publish your fundraiser.",
    icon: (
      <SendHorizontal className="stroke-[#265B34]" strokeWidth={2} size={30} />
    ),
    button: "Add Venmo Info",
    step: 2,
    completed: false,
  },
  {
    key: "pickupLocation",
    name: "Add pickup information details",
    description:
      "The pickup information specifies where buyers can pickup the fundraiser items. This is required to publish your fundraiser.",
    icon: (
      <ShoppingBag className="stroke-[#265B34]" strokeWidth={2} size={30} />
    ),
    button: "Add Pickup Info",
    step: 0,
    completed: false,
  },
  {
    key: "goalAmount",
    name: "Add your target sales",
    description:
      "The target sales specifies how much the fundraiser aims to raise. This will be helpful to keep track the analytics of the fundraiser.",
    icon: (
      <CircleDollarSign
        className="stroke-[#265B34]"
        strokeWidth={2}
        size={30}
      />
    ),
    button: "Add Goal Amount",
    step: 0,
    completed: false,
  },
  {
    key: "items",
    name: "Add fundraiser items",
    description:
      "The fundraiser items are what you will be selling to buyers. Having fundraiser items help raising more money to your fundraiser.",
    icon: (
      <ShoppingCart className="stroke-[#265B34]" strokeWidth={2} size={30} />
    ),
    button: "Add Fundraiser Items",
    step: 1,
    completed: false,
  },
];
interface ListItem {
  key: string;
  name: string;
  description: string;
  icon: ReactNode;
  button: string;
  completed: boolean;
  step: number;
}
const getChecklistStatus = (
  fundraiser: z.infer<typeof CompleteFundraiserSchema>,
  fundraiserItems: z.infer<typeof CompleteItemSchema>[]
) => {
  return checkListData.map((item) => {
    let completed = false;

    switch (item.key) {
      case "imageUrls":
        // completed = fundraiser.imageUrls && fundraiser.imageUrls.length > 0;
        completed = true;
        break;
      case "description":
        completed = !!fundraiser.description?.trim();
        break;
      case "venmoInfo":
        completed =
          !!fundraiser.venmoUsername?.trim() || !!fundraiser.venmoEmail?.trim();
        break;
      case "pickupLocation":
        completed = !!fundraiser.pickupLocation?.trim();
        break;
      case "goalAmount":
        completed = !!fundraiser.goalAmount;
        break;
      case "items":
        completed = fundraiserItems.length > 0;
        break;
      default:
        completed = false;
    }

    return { ...item, completed };
  });
};

export default function ListPage({
  fundraiser,
  fundraiserItems,
  onAction,
  isPublish,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  fundraiserItems: z.infer<typeof CompleteItemSchema>[];
  onAction: (step: number) => void;
  isPublish: (publish: boolean) => void;
}) {
  const checkListData = getChecklistStatus(fundraiser, fundraiserItems);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(
    checkListData.find((item) => !item.completed) || null
  );
  const [canPublish, setCanPublish] = useState(false);

  useEffect(() => {
    const allCompleted = checkListData.every((item) => item.completed);
    setCanPublish(allCompleted);
    if (allCompleted) {
      setSelectedItem((prev) => prev ?? checkListData[0]);
    }
  }, [checkListData]);

  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Left Panel - List Items */}
        <div className="border-r border-border p-6">
          <div className="space-y-2">
            {checkListData.map((item) => (
              <button
                key={item.key}
                onClick={() => !item.completed && setSelectedItem(item)}
                disabled={item.completed}
                className={cn(
                  "w-full rounded-lg px-4 py-3 text-left transition-colors",
                  item.completed
                    ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground line-through"
                    : "cursor-pointer border-border bg-card hover:border-ring hover:bg-accent",
                  selectedItem?.key === item.key &&
                    !item.completed &&
                    "border-ring bg-accent"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-[1px] flex items-center justify-center",
                      item.completed
                        ? "border-muted-foreground"
                        : "border-foreground"
                    )}
                  >
                    {item.completed && (
                      <svg
                        className="h-full w-full text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Item Details */}
        <div className="p-6">
          {selectedItem ? (
            <div className="space-y-3">
              {canPublish ? (
                <Upload className="stroke-[#265B34]" />
              ) : (
                selectedItem.icon
              )}
              <h3 className="text-xl font-semibold text-foreground">
                {canPublish ? "Ready to Publish?" : selectedItem.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {canPublish
                  ? "Press the button below if you are ready to publish. \n NOTE: you will NOT be able to edit most of the fields once you do so"
                  : selectedItem.description}
              </p>
              {canPublish ? (
                <Button
                  onClick={() => isPublish(true)}
                  className="bg-[#265B34] hover:bg-[#1f4a2b]"
                >
                  Publish Fundraiser
                </Button>
              ) : (
                <Button
                  className="bg-[#265B34] hover:bg-[#1f4a2b]"
                  onClick={() => onAction(selectedItem.step)}
                >
                  {selectedItem.button}
                  <MoveRight />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select an active task to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
