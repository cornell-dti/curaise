"use client";

import { redirect } from "next/navigation";
import { CreateFundraiserBody, CreateFundraiserItemBody } from "common";
import { toast } from "sonner";
import { z } from "zod";
import { useEffect, useState } from "react";
import { mutationFetch } from "@/lib/fetcher";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import MultiStepForm from "@/components/custom/MultiStepForm";
import { FundraiserBasicInfoForm } from "@/app/seller/org/[id]/create-fundraiser/components/FundraiserBasicInfoForm";
import { FundraiserVenmoInfoForm } from "@/app/seller/org/[id]/create-fundraiser/components/FundraiserVenmoInfoForm";
import { ReviewFundraiserForm } from "@/app/seller/org/[id]/create-fundraiser/components/ReviewFundraiserForm";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FundraiserEditItemsForm } from "./EditItems";
import {
	EditPickupEventsForm,
	PendingPickupEventChanges,
} from "./EditPickupEvents";
import { PendingItemChanges } from "./ItemDialog";
import { PickupEventSchema } from "common";

export function EditFundraiserModal({
	token,
	fundraiser,
	currentFundraiserItems,
	open,
	setOpen,
	step,
}: {
	token: string;
	fundraiser: z.infer<typeof CompleteFundraiserSchema>;
	currentFundraiserItems: z.infer<typeof CompleteItemSchema>[];
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
	step: number;
	setStep: React.Dispatch<React.SetStateAction<number>>;
}) {
	const [formData, setFormData] = useState<
		z.infer<typeof CreateFundraiserBody>
	>({
		name: fundraiser.name,
		description: fundraiser.description,
		imageUrls: [], // Not implemented yet
		goalAmount: fundraiser.goalAmount ?? undefined,
		buyingStartsAt: fundraiser.buyingStartsAt,
		buyingEndsAt: fundraiser.buyingEndsAt,
		organizationId: fundraiser.organization.id,
		venmoEmail: fundraiser.venmoEmail ?? undefined,
		venmoUsername: fundraiser.venmoUsername ?? undefined,
		pickupEvents: fundraiser.pickupEvents ?? [],
	});
	const [fundraiserItems, setFundraiserItems] = useState<
		z.infer<typeof CompleteItemSchema>[]
	>(currentFundraiserItems);
	const [pickupEvents, setPickupEvents] = useState<
		z.infer<typeof PickupEventSchema>[]
	>(fundraiser.pickupEvents);
	const [formFundraiserItems, setFormFundraiserItems] = useState<
		z.infer<typeof CreateFundraiserItemBody>[]
	>(
		currentFundraiserItems.map(({ id, imageUrl, ...rest }) => ({
			...rest,
			imageUrl: imageUrl ?? undefined,
		}))
	);

	// Track pending changes for published fundraisers
	// Batch API calls on these pending changes when fundraiser is saved

	// PickUp Events are allowed to be
	// 1. Created
	// 2. Updated (Date, Time, and Location)
	// 3. Deleted
	const [pendingPickupEventChanges, setPendingPickupEventChanges] =
		useState<PendingPickupEventChanges>({
			created: [],
			updated: [],
			deleted: [],
		});

	// Fundraiser Items can only be created
	// Cannot be deleted after fundraiser is published
	const [pendingItemChanges, setPendingItemChanges] =
		useState<PendingItemChanges>({
			created: [],
		});

	async function onSubmit() {
		// Map empty-string venmo fields to null so backend will clear them
		const payload = {
			...formData,
			venmoEmail: formData.venmoEmail === "" ? null : formData.venmoEmail,
			venmoUsername:
				formData.venmoUsername === "" ? null : formData.venmoUsername,
		} as typeof formData & {
			venmoEmail: string | null;
			venmoUsername: string | null;
		};

		// Update the fundraiser basic info
		try {
			await mutationFetch(`/fundraiser/${fundraiser.id}/update`, {
				token,
				body: payload,
			});
		} catch (error) {
			toast.error(
				`Failed to update fundraiser: ${error instanceof Error ? error.message : "Unknown error"}`
			);
			return;
		}

		// Submit all pending changes (batched concurrently)
		const errors: string[] = []; // Tracks all errors from failed API calls

		// Submit pending pickup event changes concurrently
		// 1. Delete events
		const deleteResults = await Promise.allSettled(
			pendingPickupEventChanges.deleted.map(async (eventId) => {
				await mutationFetch(
					`/fundraiser/${fundraiser.id}/pickup-events/${eventId}/delete`,
					{ method: "DELETE", token },
				);
			})
		);
		// AllSettled will finish when ALL promises are settled
		// Works even if one promise fails
		deleteResults.forEach((result) => {
			if (result.status === "rejected") {
				errors.push(`Failed to delete pickup event: ${result.reason.message}`);
			}
		});

		// 2. Update events
		const updateResults = await Promise.allSettled(
			pendingPickupEventChanges.updated.map(async (update) => {
				await mutationFetch(
					`/fundraiser/${fundraiser.id}/pickup-events/${update.id}/update`,
					{ token, body: update.data },
				);
			})
		);
		updateResults.forEach((result) => {
			if (result.status === "rejected") {
				errors.push(`Failed to update pickup event: ${result.reason.message}`);
			}
		});

		// 3. Create events
		const createEventResults = await Promise.allSettled(
			pendingPickupEventChanges.created.map(async (pending) => {
				await mutationFetch(
					`/fundraiser/${fundraiser.id}/pickup-events/create`,
					{ token, body: pending.data },
				);
			})
		);
		createEventResults.forEach((result) => {
			if (result.status === "rejected") {
				errors.push(`Failed to create pickup event: ${result.reason.message}`);
			}
		});

		// Submit pending new items concurrently and collect created items with real IDs
		const createItemResults = await Promise.allSettled(
			pendingItemChanges.created.map(async (pending) => {
				const itemResult = await mutationFetch(
					`/fundraiser/${fundraiser.id}/items/create`,
					{ token, body: pending.data },
				);
				return itemResult.data as z.infer<typeof CompleteItemSchema>;
			})
		);

		const createdItems: z.infer<typeof CompleteItemSchema>[] = [];
		createItemResults.forEach((result) => {
			if (result.status === "fulfilled") {
				createdItems.push(result.value);
			} else {
				errors.push(`Failed to create item: ${result.reason.message}`);
			}
		});

		// Replace temp items with real items from database
		// The pending items will have temporary IDs indicating that they're not written to database yet
		// Once API call is done, replace these temp objects with real items stored in db
		if (createdItems.length > 0) {
			setFundraiserItems((prev) => {
				// Filter out all temp items
				const nonTempItems = prev.filter(
					(item) => !item.id.startsWith("temp-")
				);
				// Add the newly created items with real IDs
				return [...nonTempItems, ...createdItems];
			});
			// Clear pending changes since they've been saved
			setPendingItemChanges({ created: [] });
		}

		if (errors.length > 0) {
			toast.error(`Some changes failed: ${errors.join(", ")}`);
		}

		toast.success("Fundraiser saved successfully");
		redirect("/seller/fundraiser/" + fundraiser.id);
	}
	const [currentStep, setCurrentStep] = useState(step);
	const [saveRequested, setSaveRequested] = useState(false);

	useEffect(() => {
		if (open) setCurrentStep(step);
	}, [open, step]);

	useEffect(() => {
		if (saveRequested) {
			onSubmit();
			setSaveRequested(false);
		}
	}, [saveRequested, onSubmit]);

	useEffect(() => {
		if (open) setCurrentStep(step);
	}, [open, step]);

	useEffect(() => {
		setFormFundraiserItems(
			fundraiserItems.map(({ id, imageUrl, ...rest }) => ({
				...rest,
				imageUrl: imageUrl ?? undefined,
			}))
		);
	}, [fundraiserItems]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="flex flex-col max-h-[92vh] max-w-5xl p-0">
				<DialogHeader className="w-full px-6 py-4 border-b bg-gray-50/50">
					<DialogTitle className="text-lg font-semibold text-gray-900">
						Edit Fundraiser Information
					</DialogTitle>
				</DialogHeader>

				<div className="w-full px-20 py-6 overflow-y-auto">
					<MultiStepForm
						labels={[
							"Basic Information",
							"Pickup Events",
							"Add Items",
							"Venmo Information",
							"Review Fundraiser",
						]}
						currentStep={currentStep}>
						<FundraiserBasicInfoForm
							defaultValues={formData}
							onNext={(data) => {
								setFormData((prev) => ({ ...prev, ...data }));
								setCurrentStep(1);
							}}
							onSave={(data) => {
								setFormData((prev) => ({ ...prev, ...data }));
								setSaveRequested(true);
								setOpen(false);
							}}
						/>

						<EditPickupEventsForm
							token={token}
							fundraiserId={fundraiser.id}
							events={pickupEvents}
							setEvents={setPickupEvents}
							onPendingChanges={setPendingPickupEventChanges}
							onSubmit={() => setCurrentStep(2)}
							onBack={() => setCurrentStep(0)}
							onSave={() => {
								setSaveRequested(true);
								setOpen(false);
							}}
						/>

						<FundraiserEditItemsForm
							token={token}
							fundraiserId={fundraiser.id}
							items={fundraiserItems}
							setItems={setFundraiserItems}
							isPublished={fundraiser.published}
							onAddPendingItem={(tempId, item) => {
								setPendingItemChanges((prev) => ({
									...prev,
									created: [...prev.created, { tempId, data: item }],
								}));
							}}
							onUpdatePendingItem={(tempId, item) => {
								setPendingItemChanges((prev) => ({
									...prev,
									created: prev.created.map((pending) =>
										pending.tempId === tempId ? { tempId, data: item } : pending
									),
								}));
							}}
							onRemovePendingItem={(itemId) => {
								// Remove pending item by temp ID
								setPendingItemChanges((prev) => ({
									...prev,
									created: prev.created.filter(
										(pending) => pending.tempId !== itemId
									),
								}));
							}}
							onSubmit={() => setCurrentStep(3)}
							onBack={() => setCurrentStep(1)}
							onSave={() => {
								setSaveRequested(true);
								setOpen(false);
							}}
						/>

						<FundraiserVenmoInfoForm
							defaultValues={formData}
							onNext={(data) => {
								setFormData((prev) => ({ ...prev, ...data }));
								setCurrentStep(4);
							}}
							onBack={() => setCurrentStep(2)}
							onSave={(data) => {
								setFormData((prev) => ({ ...prev, ...data }));
								setSaveRequested(true);
								setOpen(false);
							}}
						/>

						<ReviewFundraiserForm
							formData={formData}
							items={formFundraiserItems}
							onSave={() => {
								onSubmit();
								setOpen(false);
							}}
							onBack={() => setCurrentStep(3)}
						/>
					</MultiStepForm>
				</div>
			</DialogContent>
		</Dialog>
	);
}
