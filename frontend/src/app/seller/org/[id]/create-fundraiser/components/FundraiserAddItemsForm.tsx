import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CreateFundraiserItemBody } from "common";
import { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
import { PlusCircle, X, ShoppingCart } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

export function FundraiserAddItemsForm({
  items,
  setItems,
  onSubmit,
  onBack,
}: {
  items: z.infer<typeof CreateFundraiserItemBody>[];
  setItems: Dispatch<
    SetStateAction<z.infer<typeof CreateFundraiserItemBody>[]>
  >;
  onSubmit: () => void;
  onBack: () => void;
}) {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof CreateFundraiserItemBody>>({
    resolver: zodResolver(CreateFundraiserItemBody),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      imageUrl: undefined,
      offsale: false, // Always set to false
    },
  });

  const handleAddItem = (data: z.infer<typeof CreateFundraiserItemBody>) => {
    // Add a temporary ID to the new item
    const newItem: z.infer<typeof CreateFundraiserItemBody> = {
      ...data,
      imageUrl: data.imageUrl || undefined, // Ensure imageUrl is either the value or null
      offsale: false, // Always set to false
    };

    setItems((prev) => [...prev, newItem]);
    form.reset();
    setOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Items to Your Fundraiser</CardTitle>
        <CardDescription>
          Add items that people can purchase to support your fundraiser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddItem)}>
                  <DialogHeader>
                    <DialogTitle>Add Fundraiser Item</DialogTitle>
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
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={field.value?.toString() || "0"}
                              onChange={(e) => {
                                // Convert string value to number for the form state
                                const numericValue =
                                  parseFloat(e.target.value) || 0;
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
                    <Button type="submit">Add Item</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
            <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-500">
              No items added yet. Click "Add Item" to create items for your
              fundraiser.
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onSubmit}>
          Next
        </Button>
      </CardFooter>
    </Card>
  );
}
