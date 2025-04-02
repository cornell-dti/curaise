import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateOrganizationBody } from "common";
import { useForm } from "react-hook-form";
import { z } from "zod";

export function ReviewOrganizationForm({
  formData,
  onSubmit,
  onBack,
}: {
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
        {formData.venmoUsername && (
          <p>
            Venmo Username: <b>@{formData.venmoUsername}</b>
          </p>
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
