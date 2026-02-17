"use client";

import { redirect } from "next/navigation";
import { CreateOrganizationBody } from "common";
import { toast } from "sonner";
import { z } from "zod";
import MultiStepForm from "../../../../../components/custom/MultiStepForm";
import { useState } from "react";
import { mutationFetch } from "@/lib/fetcher";
import { OrganizationBasicInfoForm } from "./OrganizationBasicInfoForm";
import { OrganizationAddAdminsForm } from "./OrganizationAddAdminsForm";
import { ReviewOrganizationForm } from "./ReviewOrganizationForm";

export function CreateOrganizationForm({ token }: { token: string }) {
  const [adminEmails, setAdminEmails] = useState<string[]>([]);

  const [formData, setFormData] = useState<
    z.infer<typeof CreateOrganizationBody>
  >({
    name: "",
    description: "",
    logoUrl: undefined, // temporarily undefined because form doesn't populate these values
    websiteUrl: "",
    instagramUsername: "",
    addedAdminsEmails: [],
  });

  async function onSubmit() {
    const dataToSubmit = {
      ...formData,
      addedAdminsEmails: adminEmails,
    };

    try {
      const result = await mutationFetch("/organization/create", {
        token,
        body: dataToSubmit,
      });
      toast.success(result.message);
      redirect("/seller/org/" + (result.data as { id: string }).id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      return;
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
          adminEmails={adminEmails}
          setAdminEmails={setAdminEmails}
          onSubmit={(data) => {
            setFormData((prev) => ({ ...prev, ...data }));
            setCurrentStep(2);
          }}
          onBack={() => setCurrentStep(0)}
        />

        <ReviewOrganizationForm
          adminEmails={adminEmails}
          formData={formData}
          onSubmit={onSubmit}
          onBack={() => setCurrentStep(1)}
        />
      </MultiStepForm>
    </div>
  );
}
