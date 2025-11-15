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
import { ReviewFundraiserForm } from "@/app/seller/org/[id]/create-fundraiser/components/ReviewFundraiserForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FundraiserEditItemsForm } from "./EditItems";

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
  const [formFundraiserItems, setFormFundraiserItems] = useState<
    z.infer<typeof CreateFundraiserItemBody>[]
  >(
    currentFundraiserItems.map(({ id, imageUrl, ...rest }) => ({
      ...rest,
      imageUrl: imageUrl ?? undefined,
    }))
  );

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

    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/fundraiser/${fundraiser.id}/update`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
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

    toast.success("Fundraiser created successfully");
    redirect("/seller/fundraiser/" + fundraiserId);
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
      <DialogContent className="flex flex-col max-h-[85vh] max-w-3xl p-0">
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
              onSave={(data) => {
                setFormData((prev) => ({ ...prev, ...data }));
                setSaveRequested(true);
                setOpen(false);
              }}
            />

            <FundraiserEditItemsForm
              token={token}
              fundraiserId={fundraiser.id}
              items={fundraiserItems}
              setItems={setFundraiserItems}
              onSubmit={() => setCurrentStep(2)}
              onBack={() => setCurrentStep(0)}
              onSave={() => {
                setSaveRequested(true);
                setOpen(false);
              }}
            />

            <FundraiserVenmoInfoForm
              defaultValues={formData}
              onSubmit={(data) => {
                setFormData((prev) => ({ ...prev, ...data }));
                setCurrentStep(3);
              }}
              onBack={() => setCurrentStep(1)}
              onSave={(data) => {
                setFormData((prev) => ({ ...prev, ...data }));
                setSaveRequested(true);
                setOpen(false);
              }}
            />

            <ReviewFundraiserForm
              formData={formData}
              items={formFundraiserItems}
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
