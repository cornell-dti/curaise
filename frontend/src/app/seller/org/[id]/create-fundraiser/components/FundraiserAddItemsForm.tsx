import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { CreateFundraiserItemBody } from "common";
import { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
import { PlusCircle, X, ShoppingCart, Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ItemDialog } from "@/app/seller/fundraiser/[id]/components/ItemDialog";
import { DEFAULT_ITEM_VALUES } from "@/app/seller/fundraiser/[id]/components/EditItems";
import { itemCategoryInfo } from "@/lib/item-categories";

export function FundraiserAddItemsForm({
	items,
	setItems,
	onNext,
	onBack,
	onSave,
	isSubmitting,
}: {
	items: z.infer<typeof CreateFundraiserItemBody>[];
	setItems: Dispatch<
		SetStateAction<z.infer<typeof CreateFundraiserItemBody>[]>
	>;
	onNext: () => void;
	onBack: () => void;
	onSave: () => void;
	isSubmitting: boolean;
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
			price: Number(item.price),
			imageUrl: item.imageUrl,
			offsale: item.offsale,
			limit: item.limit,
			category: item.category,
		});
		setOpen(true);
	};

	const handleSubmitItem = (data: z.infer<typeof CreateFundraiserItemBody>) => {
		if (mode === "edit" && editingIndex !== null) {
			setItems((prev) =>
				prev.map((item, index) => (index === editingIndex ? data : item))
			);
			return;
		}

		setItems((prev) => [...prev, data]);
	};

	const handleRemoveItem = (index: number) => {
		setItems((prev) => prev.filter((_, idx) => idx !== index));
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Add Items to Your Fundraiser</CardTitle>
				<CardDescription>
					Add items that people can purchase to support your fundraiser. You can
					edit these items now, and again after the fundraiser is created.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex justify-end mb-4">
					<Button onClick={openAddDialog}>
						<PlusCircle className="mr-2 h-4 w-4" />
						Add Item
					</Button>
					<ItemDialog
						persistence="local"
						open={open}
						setOpen={setOpen}
						form={form}
						mode={mode}
						onLocalSubmit={handleSubmitItem}
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
								className="flex items-start justify-between p-4 border rounded-lg">
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<h4 className="font-medium">{item.name}</h4>
										<span className="text-gray-400">·</span>
										<span className="text-sm text-gray-500">
											{itemCategoryInfo[item.category].label}
										</span>
									</div>
									<p className="text-sm text-gray-500 mt-1">
										{item.description}
									</p>
									<div className="flex items-center gap-3 mt-2">
										<p className="text-sm font-medium">
											${Number(item.price).toFixed(2)}
										</p>
										{item.limit != null && (
											<p className="text-sm text-gray-500">
												Cap: {item.limit}
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => openEditDialog(index)}
										aria-label="Edit item">
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveItem(index)}
										aria-label="Remove item">
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
						disabled={isSubmitting}
					>
						{isSubmitting ? "Processing..." : "Save"}
					</Button>
					<Button type="button" onClick={onNext}>
						Next
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
