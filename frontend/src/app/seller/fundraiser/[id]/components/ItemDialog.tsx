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
} from "@/components/ui/dialog";
import UploadImageComponent from "@/components/custom/UploadImageComponent";
import { UnsplashPickerModal } from "@/components/custom/UnsplashPickerModal";
import { UseFormReturn } from "react-hook-form";
import { CompleteItemSchema, CreateFundraiserItemBody } from "common";
import { z } from "zod";
import { toast } from "sonner";
import { DEFAULT_ITEM_VALUES } from "./EditItems";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SetStateAction, useState } from "react";
import { Input } from "@/components/ui/input";
import { Decimal } from "decimal.js";
import { ImageIcon, X } from "lucide-react";
import Image from "next/image";

// Type for tracking pending new items
export type PendingItemChanges = {
	created: { tempId: string; data: z.infer<typeof CreateFundraiserItemBody> }[];
};

// Callback to add a new pending item
export type OnAddPendingItem = (
	tempId: string,
	item: z.infer<typeof CreateFundraiserItemBody>
) => void;

// Callback to update a pending item by temp ID
export type OnUpdatePendingItem = (
	tempId: string,
	item: z.infer<typeof CreateFundraiserItemBody>
) => void;

export function ItemDialog({
	open,
	setOpen,
	form,
	mode,
	items,
	setItems,
	editingIndex,
	onAddPendingItem,
	onUpdatePendingItem,
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
	isPublished?: boolean;
	onAddPendingItem?: OnAddPendingItem;
	onUpdatePendingItem?: OnUpdatePendingItem;
}) {
	const [unsplashOpen, setUnsplashOpen] = useState(false);

	const handleSubmitItem = async (
		data: z.infer<typeof CreateFundraiserItemBody>
	) => {
		const item: z.infer<typeof CreateFundraiserItemBody> = {
			...data,
			offsale: false,
		};

		// Always store changes locally
		if (mode === "add" || editingIndex === null) {
			// Create a temporary item for display
			const tempId = `temp-${Date.now()}`;
			const tempItem: z.infer<typeof CompleteItemSchema> = {
				id: tempId,
				name: item.name,
				description: item.description,
				price: new Decimal(item.price),
				imageUrl: item.imageUrl,
				offsale: false,
			};
			setItems((prev) => [...prev, tempItem]);

			// Track this pending item with its temp ID
			if (onAddPendingItem) {
				onAddPendingItem(tempId, item);
			}
			toast.success("Item added (will be saved when you finalize)");
		} else {
			// Edit existing item locally
			const editingItem = items[editingIndex];
			if (!editingItem) {
				toast.error("Could not find item to update");
				return;
			}

			// Update item in local state
			const updatedItem: z.infer<typeof CompleteItemSchema> = {
				...editingItem,
				name: item.name,
				description: item.description,
				price: new Decimal(item.price),
				imageUrl: item.imageUrl,
			};
			setItems((prev) =>
				prev.map((it, idx) => (idx === editingIndex ? updatedItem : it))
			);

			// If editing a temp item, update the pending changes
			if (editingItem.id.startsWith("temp-") && onUpdatePendingItem) {
				onUpdatePendingItem(editingItem.id, item);
			}

			toast.success("Item updated (will be saved when you finalize)");
		}

		setOpen(false);
		form.reset(DEFAULT_ITEM_VALUES);
	};

	return (
		<>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-2xl">
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
											<div className="flex items-center justify-between">
												<FormLabel>Image</FormLabel>
												<Button
													type="button"
													variant="outline"
													size="sm"
													onClick={() => setUnsplashOpen(true)}
													className="flex items-center gap-1.5 text-xs h-7 px-2">
													<ImageIcon className="h-3.5 w-3.5" />
													Search Unsplash
												</Button>
											</div>
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
											{(() => {
												const url = form.watch("imageUrl");
												if (!url || !url.includes("unsplash.com")) return null;
												return (
													<div className="relative aspect-video bg-gray-50 rounded-md border overflow-hidden group min-h-[100px] mt-2">
														<Image
															src={url}
															fill
															sizes="(max-width: 768px) 100vw, 50vw"
															alt="Unsplash photo"
															className="object-cover"
														/>
														<button
															type="button"
															onClick={() =>
																form.setValue("imageUrl", undefined)
															}
															className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
															aria-label="Remove image">
															<X className="h-3 w-3" />
														</button>
													</div>
												);
											})()}
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

			<UnsplashPickerModal
				open={unsplashOpen}
				onOpenChange={setUnsplashOpen}
				onSelectPhotos={(urls) => {
					if (urls.length > 0) {
						form.setValue("imageUrl", urls[0]);
					}
				}}
				allowMultiple={false}
			/>
		</>
	);
}
