"use client";

import { redirect } from "next/navigation";
import { CreateOrganizationBody, UserSchema } from "common";
import { toast } from "sonner";
import { z } from "zod";
import MultiStepForm from "../../../../../components/custom/MultiStepForm";
import { useState } from "react";
import { OrganizationBasicInfoForm } from "./OrganizationBasicInfoForm";
import { OrganizationAddAdminsForm } from "./OrganizationAddAdminsForm";
import { ReviewOrganizationForm } from "./ReviewOrganizationForm";

export function CreateOrganizationForm({ token }: { token: string }) {
  const [admins, setAdmins] = useState<z.infer<typeof UserSchema>[]>([]);

  const [formData, setFormData] = useState<
    z.infer<typeof CreateOrganizationBody>
  >({
    name: "",
    description: "",
    logoUrl: undefined, // temporarily undefined because form doesn't populate these values
    websiteUrl: "",
    instagramUsername: "",
    venmoUsername: undefined, // temporarily undefined because form doesn't populate these values
    addedAdminsIds: [],
  });

  async function onSubmit() {
    const dataToSubmit = {
      ...formData,
      addedAdminsIds: admins.map((admin) => admin.id),
    };

    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/organization/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(dataToSubmit),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      toast.error(result.message);
      return;
    } else {
      toast.success(result.message);
      redirect("/seller/org/" + result.data.id);
    }
  }

  const [currentStep, setCurrentStep] = useState(0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <MultiStepForm
        labels={["Basic Information", "Add Admins", "Review Organization"]}
        currentStep={currentStep}
      >
        <OrganizationBasicInfoForm
          defaultValues={formData}
          onSubmit={(data) => {
            setFormData((prev) => ({ ...prev, ...data }));
            setCurrentStep(1);
          }}
        />

        <OrganizationAddAdminsForm
          admins={admins}
          setAdmins={setAdmins}
          onSubmit={(data) => {
            setFormData((prev) => ({ ...prev, ...data }));
            setCurrentStep(2);
          }}
          onBack={() => setCurrentStep(0)}
        />

        <ReviewOrganizationForm
          admins={admins}
          formData={formData}
          onSubmit={onSubmit}
          onBack={() => setCurrentStep(1)}
        />
      </MultiStepForm>
    </div>
  );
}
