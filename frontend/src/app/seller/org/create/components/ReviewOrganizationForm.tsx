import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOrganizationBody } from "common";
import { z } from "zod";

export function ReviewOrganizationForm({
  adminEmails,
  formData,
  onSubmit,
  onBack,
}: {
  adminEmails: string[];
  formData: z.infer<typeof CreateOrganizationBody>;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Organization</CardTitle>
        <CardDescription>
          Review the information about your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <p>
            Name: <b>{formData.name}</b>
          </p>
          <p>
            Description:{" "}
            {formData.description ? <b>{formData.description}</b> : "(none)"}
          </p>
          {formData.websiteUrl && (
            <p>
              Website URL: <b>{formData.websiteUrl}</b>
            </p>
          )}
          {formData.instagramUsername && (
            <p>
              Instagram Username: <b>@{formData.instagramUsername}</b>
            </p>
          )}
        </div>
        {adminEmails.length > 0 && (
          <div className="mt-4 space-y-2">
            <p>Additional Admins:</p>
            <ul className="space-y-2">
              {adminEmails.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between bg-muted p-2 rounded-md"
                >
                  <span className="text-sm">{email}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" onClick={onSubmit}>
          Create
        </Button>
      </CardFooter>
    </Card>
  );
}
