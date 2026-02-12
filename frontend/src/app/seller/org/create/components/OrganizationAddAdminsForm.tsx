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
import { CreateOrganizationBody, UserSchema } from "common";
import { X } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { serverFetch } from "@/lib/fetcher";

const AddAdminsSchema = CreateOrganizationBody.pick({
  addedAdminsIds: true,
});

export function OrganizationAddAdminsForm({
  admins,
  setAdmins,
  onSubmit,
  onBack,
}: {
  admins: z.infer<typeof UserSchema>[];
  setAdmins: React.Dispatch<React.SetStateAction<z.infer<typeof UserSchema>[]>>;
  onSubmit: (data: z.infer<typeof AddAdminsSchema>) => void;
  onBack: () => void;
}) {
  const [adminEmail, setAdminEmail] = useState("");

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) {
      toast.error("Please enter an admin email");
      return;
    }

    try {
      const user = await serverFetch(
        `/user/search?email=${encodeURIComponent(adminEmail)}`,
        { schema: UserSchema },
      );

      // Check if admin is already in the list
      if (admins.some((admin) => admin.id === user.id)) {
        toast.error("This user is already added as an admin");
        return;
      }

      setAdmins((prev) => [...prev, user]);
      setAdminEmail("");
      toast.success(`${user.name} added to list`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error adding admin");
    }
  };

  const removeAdmin = (adminId: string) => {
    setAdmins((prev) => prev.filter((admin) => admin.id !== adminId));
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

        {admins.length > 0 && (
          <div className="mt-4 space-y-2">
            <p>Additional Admins:</p>
            <ul className="space-y-2">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between bg-muted p-2 rounded-md"
                >
                  <span className="text-sm">
                    {admin.name} ({admin.email})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdmin(admin.id)}
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
              addedAdminsIds: admins.map((admin) => admin.id),
            })
          }
        >
          Next
        </Button>
      </CardFooter>
    </Card>
  );
}
