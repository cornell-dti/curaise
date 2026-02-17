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
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateOrganizationBody } from "common";
import { X } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { serverFetch } from "@/lib/fetcher";

const AddAdminsSchema = CreateOrganizationBody.pick({
  addedAdminsEmails: true,
});

export function OrganizationAddAdminsForm({
  adminEmails,
  setAdminEmails,
  onSubmit,
  onBack,
}: {
  adminEmails: string[];
  setAdminEmails: React.Dispatch<React.SetStateAction<string[]>>;
  onSubmit: (data: z.infer<typeof AddAdminsSchema>) => void;
  onBack: () => void;
}) {
  const [adminEmail, setAdminEmail] = useState("");

  const handleAddAdmin = () => {
    const trimmedEmail = adminEmail.trim();

    if (!trimmedEmail) {
      toast.error("Please enter an admin email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if email is already in the list
    if (adminEmails.some((email) => email.toLowerCase() === trimmedEmail.toLowerCase())) {
      toast.error("This email is already added");
      return;
    }

    setAdminEmails((prev) => [...prev, trimmedEmail]);
    setAdminEmail("");
    toast.success(`${trimmedEmail} added to list`);
  };

  const removeAdmin = (emailToRemove: string) => {
    setAdminEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Additional Admins (Optional)</CardTitle>
        <CardDescription>
          Add other users as admins to your new organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <Input
            placeholder="Admin Email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
          <Button onClick={handleAddAdmin}>Add Admin</Button>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdmin(email)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
        <Button
          type="submit"
          onClick={() =>
            onSubmit({
              addedAdminsEmails: adminEmails,
            })
          }
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
}
