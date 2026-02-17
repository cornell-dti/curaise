"use client";

import { redirect } from "next/navigation";
import { CreateFundraiserBody, CreateFundraiserItemBody } from "common";
import { toast } from "sonner";
import { z } from "zod";
import MultiStepForm from "../../../../../../components/custom/MultiStepForm";
import { useState } from "react";
import { mutationFetch } from "@/lib/fetcher";
import { FundraiserBasicInfoForm } from "./FundraiserBasicInfoForm";
import { FundraiserPickupEventsForm } from "./FundraiserPickupEventsForm";
import { FundraiserAddItemsForm } from "./FundraiserAddItemsForm";
import { ReviewFundraiserForm } from "./ReviewFundraiserForm";
import { FundraiserVenmoInfoForm } from "./FundraiserVenmoInfoForm";

const getDefaultDates = () => {
	const now = new Date();

	const buyingStartsAt = new Date(now);
	buyingStartsAt.setHours(9, 0, 0, 0);

	const buyingEndsAt = new Date(now);
	buyingEndsAt.setDate(now.getDate() + 1);
	buyingEndsAt.setHours(21, 0, 0, 0);

	const pickupStartsAt = new Date(now);
	pickupStartsAt.setDate(now.getDate() + 1);
	pickupStartsAt.setHours(9, 0, 0, 0);

	const pickupEndsAt = new Date(now);
	pickupEndsAt.setDate(now.getDate() + 1);
	pickupEndsAt.setHours(22, 0, 0, 0);

	return {
		buyingStartsAt,
		buyingEndsAt,
		pickupStartsAt,
		pickupEndsAt,
	};
};

export function CreateFundraiserForm({
	token,
	organizationId,
}: {
	token: string;
	organizationId: string;
}) {
	const defaultDates = getDefaultDates();
	const [currentStep, setCurrentStep] = useState(0);

	const [formData, setFormData] = useState<
		z.infer<typeof CreateFundraiserBody>
	>({
		name: "",
		description: "",
		imageUrls: [], // Not implemented yet
		goalAmount: undefined,
		buyingStartsAt: defaultDates.buyingStartsAt,
		buyingEndsAt: defaultDates.buyingEndsAt,
		pickupEvents: [],
		organizationId: organizationId,
		venmoEmail: "",
		venmoUsername: "",
	});

	// State for pickup events list
	const [pickupEvents, setPickupEvents] = useState<
		z.infer<typeof CreateFundraiserBody>["pickupEvents"]
	>([]);

	// State for fundraiser items list
	const [fundraiserItems, setFundraiserItems] = useState<
		z.infer<typeof CreateFundraiserItemBody>[]
	>([]);

	async function onSave() {
		// Add pickupEvents into formData before submission
		const completeFormData = { ...formData, pickupEvents };

		// First create the fundraiser
		let result;
		try {
			result = await mutationFetch("/fundraiser/create", {
				token,
				body: completeFormData,
			});
		} catch (error) {
			toast.error(
				`Failed to create fundraiser: ${error instanceof Error ? error.message : "Unknown error"}`
			);
			return;
		}

		const fundraiserId = (result.data as { id: string }).id;

		// Then add items if there are any
		if (fundraiserItems.length > 0) {
			const itemResults = await Promise.allSettled(
				fundraiserItems.map(async (item, index) => {
					try {
						const itemResult = await mutationFetch(
							`/fundraiser/${fundraiserId}/items/create`,
							{ token, body: item },
						);
						return { success: true, data: itemResult.data };
					} catch (error) {
						return {
							success: false,
							item: item.name || `Item ${index + 1}`,
							error: error instanceof Error ? error.message : "Unknown error",
						};
					}
				})
			);

			// Check for any failed items
			const failedItems = itemResults.filter(
				(result) =>
					result.status === "rejected" ||
					(result.status === "fulfilled" && result.value.success === false)
			);

			if (failedItems.length > 0) {
				failedItems.forEach((result) => {
					if (result.status === "rejected") {
						toast.error(`Failed to create an item: ${result.reason}`);
					} else if (result.status === "fulfilled" && !result.value.success) {
						toast.error(
							`Failed to create ${result.value.item}: ${result.value.error}`
						);
					}
				});

				toast.warning(
					`Created fundraiser but ${failedItems.length} item(s) failed to be added`
				);
				redirect("/seller/fundraiser/" + fundraiserId);
			} else {
				toast.success("Fundraiser and all items created successfully");
				redirect("/seller/fundraiser/" + fundraiserId);
			}
		} else {
			toast.success("Fundraiser created successfully");
			redirect("/seller/fundraiser/" + fundraiserId);
		}
	}

	return (
		<div className="container mx-auto px-4 py-6 max-w-4xl">
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
						onSave();
					}}
				/>
				<FundraiserPickupEventsForm
					events={pickupEvents}
					setEvents={setPickupEvents}
					onNext={() => setCurrentStep(2)}
					onBack={() => setCurrentStep(0)}
					onSave={onSave}
				/>
				<FundraiserAddItemsForm
					items={fundraiserItems}
					setItems={setFundraiserItems}
					onNext={() => setCurrentStep(3)}
					onBack={() => setCurrentStep(1)}
					onSave={onSave}
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
						onSave();
					}}
				/>
				<ReviewFundraiserForm
					formData={{ ...formData, pickupEvents }}
					items={fundraiserItems}
					onSave={onSave}
					onBack={() => setCurrentStep(3)}
				/>
			</MultiStepForm>
		</div>
	);
}
