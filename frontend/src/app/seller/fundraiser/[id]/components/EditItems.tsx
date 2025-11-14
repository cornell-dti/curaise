import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompleteItemSchema, CreateFundraiserItemBody } from "common";
import { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
import { PlusCircle, X, ShoppingCart, Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ItemDialog } from "./ItemDialog";
// removed external type import; use a local type for delete params instead

export const DEFAULT_ITEM_VALUES = {
  name: "",
  description: "",
  price: 0,
  imageUrl: undefined,
  offsale: false,
};

export function FundraiserEditItemsForm({
  token,
  fundraiserId,
  items,
  setItems,
  onSubmit,
  onBack,
  onSave,
}: {
  token: string;
  fundraiserId: string;
  items: z.infer<typeof CompleteItemSchema>[];
  setItems: Dispatch<SetStateAction<z.infer<typeof CompleteItemSchema>[]>>;
  onSubmit: () => void;
  onBack: () => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const form = useForm<z.infer<typeof CreateFundraiserItemBody>>({
    resolver: zodResolver(CreateFundraiserItemBody),
    defaultValues: DEFAULT_ITEM_VALUES,
  });

  const openAddDialog = () => {
    setMode("add");
    setEditingIndex(null);
    form.reset(DEFAULT_ITEM_VALUES);
    setOpen(true);
  };

  const openEditDialog = (index: number) => {
    const item = items[index];
    setMode("edit");
    setEditingIndex(index);
    form.reset({
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl ?? undefined,
      offsale: item.offsale,
    });
    setOpen(true);
  };

  const deleteFundraiserItem = async (fundraiserId: string, itemId: string) => {
    const itemResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/items/${itemId}/delete`,
      {
        method: "POST", // or DELETE if you change backend
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ fundraiserId: fundraiserId, itemId: itemId }),
      }
    );

    const itemResult = await itemResponse.json();

    if (!itemResponse.ok) {
      return {
        success: false as const,
        error: itemResult.message || "Unknown error",
      };
    }

    return { success: true as const, data: itemResult.data };
  };

  const handleRemoveItem = async (item: z.infer<typeof CompleteItemSchema>) => {
    const res = await deleteFundraiserItem(fundraiserId, item.id);
    if (!res.success) {
      toast.error(res.error || "Failed to delete item");
      return;
    }

    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Items to Your Fundraiser</CardTitle>
        <CardDescription>
          Add items that people can purchase to support your fundraiser. You can
          always add more items after the creation of this fundraiser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={openAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
          <ItemDialog
            token={token}
            fundraiserId={fundraiserId}
            open={open}
            setOpen={setOpen}
            form={form}
            mode={mode}
            items={items}
            setItems={setItems}
            editingIndex={editingIndex}
          />
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
            <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500">
              No items added yet. Click &quot;Add Item&quot; to create items for
              your fundraiser.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.name}</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.description}
                  </p>
                  <p className="text-sm font-medium mt-2">
                    ${Number(item.price).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(index)}
                    aria-label="Edit item"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item)}
                    aria-label="Remove item"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={onSave}
            className="text-[#333F37] border border-current bg-transparent hover:bg-[#e6f0ea]"
          >
            Save Draft
          </Button>
          <Button type="button" onClick={onSubmit}>
            Next
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
