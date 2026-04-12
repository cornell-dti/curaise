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
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";
import { UseFormReturn } from "react-hook-form";
import { CompleteItemSchema, CreateFundraiserItemBody } from "common";
import { z } from "zod";
import { toast } from "sonner";
import { DEFAULT_ITEM_VALUES } from "./EditItems";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Decimal } from "decimal.js";
import { mutationFetch } from "@/lib/fetcher";

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
	token,
	fundraiserId,
	open,
	setOpen,
	form,
	mode,
	items,
	setItems,
	editingIndex,
	isPublished,
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
	const getPublishedLimitValidationError = (
		existingLimit: number | null,
		nextLimit: number | undefined
	) => {
		if (existingLimit === null) {
			if (nextLimit !== undefined) {
				return "Cannot add an inventory cap to a published item.";
			}
			return null;
		}

		if (nextLimit === undefined) {
			return "Cannot remove an inventory cap from a published item.";
		}

		if (nextLimit < existingLimit) {
			return `Cannot decrease inventory cap. Current cap is ${existingLimit}.`;
		}

		return null;
	};

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
				profit: item.profit !== undefined ? new Decimal(item.profit) : null,
				imageUrl: item.imageUrl,
				offsale: false,
				limit: item.limit ?? null,
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

			const isPublishedExistingItem =
				!!isPublished && !editingItem.id.startsWith("temp-");
			if (isPublishedExistingItem) {
				const limitError = getPublishedLimitValidationError(
					editingItem.limit ?? null,
					item.limit
				);
				if (limitError) {
					toast.error(limitError);
					return;
				}
			}

			// If editing a real (non-temp) item on a published fundraiser, call the API directly
			if (isPublishedExistingItem) {
				try {
					await mutationFetch(
						`/fundraiser/${fundraiserId}/items/${editingItem.id}/update`,
						{
							token,
							body: {
								name: item.name,
								description: item.description,
								price: item.price,
								profit: item.profit,
								imageUrl: item.imageUrl,
								offsale: editingItem.offsale,
								limit: item.limit !== undefined ? item.limit : null,
							},
						}
					);
				} catch (error) {
					toast.error(
						`Failed to update item: ${error instanceof Error ? error.message : "Unknown error"}`
					);
					return;
				}
			}

			// Update item in local state
			const updatedItem: z.infer<typeof CompleteItemSchema> = {
				...editingItem,
				name: item.name,
				description: item.description,
				price: new Decimal(item.price),
				profit: item.profit !== undefined ? new Decimal(item.profit) : null,
				imageUrl: item.imageUrl,
				limit: item.limit !== undefined ? item.limit : null,
			};
			setItems((prev) =>
				prev.map((it, idx) => (idx === editingIndex ? updatedItem : it))
			);

			// If editing a temp item, update the pending changes
			if (editingItem.id.startsWith("temp-") && onUpdatePendingItem) {
				onUpdatePendingItem(editingItem.id, item);
			}

			toast.success(
				isPublished && !editingItem.id.startsWith("temp-")
					? "Item updated successfully"
					: "Item updated (will be saved when you finalize)"
			);
		}

		setOpen(false);
		form.reset(DEFAULT_ITEM_VALUES);
	};

	const currentItem = editingIndex !== null ? items[editingIndex] : null;
	const isRealPublishedItem =
		isPublished && currentItem && !currentItem.id.startsWith("temp-");
	// For published items with no existing limit, the limit field is locked
	const limitLocked = isRealPublishedItem && currentItem.limit == null;
	// For published items with an existing limit, can only increase
	const limitIncreaseOnly = isRealPublishedItem && currentItem.limit != null;

	return (
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
										<FormLabel>Image</FormLabel>
										<UploadImageComponent
											imageUrls={
												form.getValues("imageUrl")
													? [form.getValues("imageUrl")!]
													: []
											}
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

							<FormField
								control={form.control}
								name="profit"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Profit (Optional)</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0.00"
												value={field.value?.toString() ?? ""}
												onChange={(e) => {
													if (e.target.value === "") {
														field.onChange(undefined);
													} else {
														field.onChange(parseFloat(e.target.value) || 0);
													}
												}}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="limit"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center gap-2">
											<FormLabel className="mb-0">Inventory Cap (Optional)</FormLabel>
											<InfoTooltip
												content="Only set a cap if necessary. Leave blank for unlimited. After publishing, an item with no cap cannot get one later, and an existing cap can only increase. Caps are enforced based on real confirmed or picked-up orders, not carts or unpaid pending orders."
												size={18}
											/>
										</div>
										<FormControl>
											<Input
												type="number"
												step="1"
												min={limitIncreaseOnly ? currentItem.limit! : 1}
												placeholder={
													limitLocked
														? "Unlimited (cannot be changed)"
														: limitIncreaseOnly
															? `Min: ${currentItem.limit}`
															: "Leave blank for unlimited"
												}
												disabled={!!limitLocked}
												value={field.value ?? ""}
												onChange={(e) => {
													if (e.target.value === "") {
														// For items that must keep a limit, don't allow clearing
														if (limitIncreaseOnly) {
															field.onChange(currentItem.limit);
														} else {
															field.onChange(undefined);
														}
													} else {
														const parsed = parseInt(e.target.value);
														// For items that must keep a limit, enforce minimum
														if (limitIncreaseOnly && parsed < currentItem.limit!) {
															field.onChange(currentItem.limit);
														} else {
															field.onChange(parsed);
														}
													}
												}}
											/>
										</FormControl>
											<p className="text-sm text-muted-foreground">
												{limitLocked
													? "This item has no cap and cannot have one added after publishing."
													: limitIncreaseOnly
														? `Cap can only be increased (current: ${currentItem.limit}).`
														: "After publishing, existing item caps can only increase."}
											</p>
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
