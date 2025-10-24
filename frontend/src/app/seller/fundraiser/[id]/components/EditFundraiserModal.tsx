"use client";

import { redirect } from "next/navigation";
import { CreateFundraiserBody, CreateFundraiserItemBody } from "common";
import { toast } from "sonner";
import { z } from "zod";
import { useEffect, useState } from "react";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import MultiStepForm from "@/components/custom/MultiStepForm";
import { FundraiserBasicInfoForm } from "@/app/seller/org/[id]/create-fundraiser/components/FundraiserBasicInfoForm";
import { FundraiserVenmoInfoForm } from "@/app/seller/org/[id]/create-fundraiser/components/FundraiserVenmoInfoForm";
import { FundraiserAddItemsForm } from "@/app/seller/org/[id]/create-fundraiser/components/FundraiserAddItemsForm";
import { ReviewFundraiserForm } from "@/app/seller/org/[id]/create-fundraiser/components/ReviewFundraiserForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EditFundraiserModal({
  token,
  fundraiser,
  currentFundraiserItems,
  open,
  setOpen,
  step,
  setStep,
}: {
  token: string;
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  currentFundraiserItems: z.infer<typeof CreateFundraiserItemBody>[];
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
    pickupLocation: fundraiser.pickupLocation,
    buyingStartsAt: fundraiser.buyingStartsAt,
    buyingEndsAt: fundraiser.buyingEndsAt,
    pickupStartsAt: fundraiser.pickupStartsAt,
    pickupEndsAt: fundraiser.pickupEndsAt,
    organizationId: fundraiser.organization.id,
    venmoEmail: fundraiser.venmoEmail ?? undefined,
    venmoUsername: fundraiser.venmoUsername ?? undefined,
  });
  const [fundraiserItems, setFundraiserItems] = useState<
    z.infer<typeof CreateFundraiserItemBody>[]
  >(() =>
    (currentFundraiserItems ?? []).map((item) => ({
      name: item.name,
      description: item.description,
      offsale: item.offsale,
      price: item.price,
      imageUrl: item.imageUrl ?? undefined,
    }))
  );

  async function onSubmit() {
    // Edit the fundraiser
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/fundraiser/${fundraiser.id}/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(formData),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      toast.error(
        `Failed to update fundraiser: ${result.message || "Unknown error"}`
      );
      return;
    }

    const fundraiserId = result.data.id;

    // Then add items if there are any
    if (currentFundraiserItems.length < fundraiserItems.length) {
      const itemResults = await Promise.allSettled(
        fundraiserItems.map(async (item, index) => {
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
              item: item.name || `Item ${index + 1}`,
              error: itemResult.message || "Unknown error",
            };
          }

          return { success: true, data: itemResult.data };
        })
      );
      setCurrentStep(0);
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
  const [currentStep, setCurrentStep] = useState(step);

  useEffect(() => {
    if (open) {
      setCurrentStep(step);
    }
  }, [open, step]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col max-h-[70vh] max-w-3xl p-0">
        <DialogHeader className="w-full px-6 py-4 border-b bg-gray-50/50">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Edit Fundraiser Information
          </DialogTitle>
        </DialogHeader>

        <div className="w-full px-20 py-6 overflow-y-auto">
          <MultiStepForm
            labels={[
              "Basic Information",
              "Add Items",
              "Venmo Information",
              "Review Fundraiser",
            ]}
            currentStep={currentStep}
          >
            <FundraiserBasicInfoForm
              defaultValues={formData}
              onSubmit={(data) => {
                setFormData((prev) => ({ ...prev, ...data }));
                setCurrentStep(1);
              }}
            />

            <FundraiserAddItemsForm
              items={fundraiserItems}
              setItems={setFundraiserItems}
              onSubmit={() => setCurrentStep(2)}
              onBack={() => setCurrentStep(0)}
            />

            <FundraiserVenmoInfoForm
              defaultValues={formData}
              onSubmit={(data) => {
                setFormData((prev) => ({ ...prev, ...data }));
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
            />

            <ReviewFundraiserForm
              formData={formData}
              items={fundraiserItems}
              onSubmit={() => {
                onSubmit();
                setOpen(false);
              }}
              onBack={() => setCurrentStep(2)}
            />
          </MultiStepForm>
        </div>
      </DialogContent>
    </Dialog>
  );
}
