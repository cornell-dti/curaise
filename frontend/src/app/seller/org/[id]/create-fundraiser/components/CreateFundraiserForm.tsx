"use client";

import { redirect } from "next/navigation";
import { CreateFundraiserBody, CreateFundraiserItemBody } from "common";
import { toast } from "sonner";
import { z } from "zod";
import MultiStepForm from "../../../../../../components/custom/MultiStepForm";
import { useEffect, useState } from "react";
import { FundraiserBasicInfoForm } from "./FundraiserBasicInfoForm";
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
  const [saveRequested, setSaveRequested] = useState(false);
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
    pickupEvents: [
      {
        startsAt: defaultDates.pickupStartsAt,
        endsAt: defaultDates.pickupEndsAt,
        location: "",
      },
    ],
    organizationId: organizationId,
    venmoEmail: "",
    venmoUsername: "",
  });

  // State for fundraiser items list
  const [fundraiserItems, setFundraiserItems] = useState<
    z.infer<typeof CreateFundraiserItemBody>[]
  >([]);

  async function onSubmit() {
    // First create the fundraiser
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/fundraiser/create",
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
        `Failed to create fundraiser: ${result.message || "Unknown error"}`
      );
      return;
    }

    const fundraiserId = result.data.id;

    // Then add items if there are any
    if (fundraiserItems.length > 0) {
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

  useEffect(() => {
    if (saveRequested) {
      onSubmit();
      setSaveRequested(false);
    }
  }, [saveRequested, formData]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
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
          }}
        />

        <FundraiserAddItemsForm
          items={fundraiserItems}
          setItems={setFundraiserItems}
          onSubmit={() => setCurrentStep(2)}
          onBack={() => setCurrentStep(0)}
          onSave={() => setSaveRequested(true)}
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
          onSave={(data) => {
            setFormData((prev) => ({ ...prev, ...data }));
            setSaveRequested(true);
          }}
        />

        <ReviewFundraiserForm
          formData={formData}
          items={fundraiserItems}
          onSubmit={onSubmit}
          onBack={() => setCurrentStep(2)}
        />
      </MultiStepForm>
    </div>
  );
}
