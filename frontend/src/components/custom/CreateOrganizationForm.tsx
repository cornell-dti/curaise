"use client";

import { CreateOrganizationBody } from "common";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import MultiStepForm from "./MultiStepForm";

export function CreateOrganizationForm({ token }: { token: string }) {
  const form = useForm<z.infer<typeof CreateOrganizationBody>>({
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      websiteUrl: "",
      instagramUsername: undefined,
      venmoUsername: undefined,
      addedAdminsIds: [],
    },
  });

  async function onSubmit(formData: z.infer<typeof CreateOrganizationBody>) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/organization/create",
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
      toast.error(result.message);
      return;
    } else {
      toast.success(result.message);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <MultiStepForm
        form={form}
        onSubmit={onSubmit}
        labels={["Basic Information", "Add Admins", "Review Organization"]}
      >
        <div>1</div>
        <div>2</div>
        <div>3</div>
      </MultiStepForm>
    </div>
  );
}
