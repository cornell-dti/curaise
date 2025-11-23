import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import UploadImageComponent from "@/components/custom/UploadImageComponent";
import { UseFormReturn } from "react-hook-form";
import {
  CompleteItemSchema,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
} from "common";
import { z } from "zod";
import { toast } from "sonner";
import { DEFAULT_ITEM_VALUES } from "./EditItems";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SetStateAction } from "react";
import { Input } from "@/components/ui/input";

export function ItemDialog({
  token,
  fundraiserId,
  open,
  setOpen,
  form,
  mode,
  items,
  setItems,
  editingIndex,
}: {
  token: string;
  fundraiserId: string;
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
  form: UseFormReturn<z.infer<typeof CreateFundraiserItemBody>>;
  mode: "add" | "edit";
  items: z.infer<typeof CompleteItemSchema>[];
  setItems: React.Dispatch<
    SetStateAction<z.infer<typeof CompleteItemSchema>[]>
  >;
  editingIndex: number | null;
}) {
  const addFundraiserItem = async (
    item: z.infer<typeof CreateFundraiserItemBody>
  ) => {
    const itemResponse = await fetch(
      process.env.NEXT_PUBLIC_API_URL +
        `/fundraiser/${fundraiserId}/items/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(item),
      }
    );

    const itemResult = await itemResponse.json();
    if (!itemResponse.ok) {
      return {
        success: false,
        item: item.name || `Item Add`,
        error: itemResult.message || "Unknown error",
      };
    }

    return { success: true, data: itemResult.data };
  };

  const updateFundraiserItem = async (
    id: string,
    item: z.infer<typeof UpdateFundraiserItemBody>
  ) => {
    const itemResponse = await fetch(
      process.env.NEXT_PUBLIC_API_URL +
        `/fundraiser/${fundraiserId}/items/${id}/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(item),
      }
    );

    const itemResult = await itemResponse.json();
    if (!itemResponse.ok) {
      return {
        success: false,
        item: item.name || `Item Update`,
        error: itemResult.message || "Unknown error",
      };
    }

    return { success: true, data: itemResult.data };
  };

  const handleSubmitItem = async (
    data: z.infer<typeof CreateFundraiserItemBody>
  ) => {
    const item: z.infer<typeof CreateFundraiserItemBody> = {
      ...data,
      offsale: false,
    };
    if (mode === "add" || editingIndex === null) {
      const res = await addFundraiserItem(item);
      if (!res.success) {
        toast.error(res.error || "Failed to add item");
        return;
      }
      setItems((prev) => [...prev, res.data]);
    } else {
      const editingItem = items[editingIndex];
      if (!editingItem) {
        toast.error("Could not find item to update");
        return;
      }
      const res = await updateFundraiserItem(editingItem.id, item);
      if (!res.success) {
        toast.error(res.error || "Failed to update item");
        return;
      }
      setItems((prev) =>
        prev.map((it, idx) => (idx === editingIndex ? res.data : it))
      );
    }

    setOpen(false);
    form.reset(DEFAULT_ITEM_VALUES);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-fit h-5/6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmitItem)}>
            <DialogHeader>
              <DialogTitle>
                {mode === "add"
                  ? "Add Fundraiser Item"
                  : "Edit Fundraiser Item"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="T-Shirt, Cookie Box, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your item..."
                        {...field}
                        className="min-h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={() => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <UploadImageComponent
                      imageUrls={[form.getValues("imageUrl") || ""]}
                      setImageUrls={(imageUrls: string[]) => {
                        if (imageUrls.length > 0) {
                          form.setValue("imageUrl", imageUrls[0]);
                        } else {
                          form.setValue("imageUrl", undefined);
                        }
                      }}
                      folder="items"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={
                          field.value !== undefined
                            ? field.value.toString()
                            : "0"
                        }
                        onChange={(e) => {
                          const numericValue = parseFloat(e.target.value) || 0;
                          field.onChange(numericValue);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {mode === "add" ? "Add Item" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
