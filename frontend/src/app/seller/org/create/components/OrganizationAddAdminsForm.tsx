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

const AddAdminsSchema = CreateOrganizationBody.pick({
  addedAdminsIds: true,
});

export function OrganizationAddAdminsForm({
  onSubmit,
  onBack,
}: {
  onSubmit: (data: z.infer<typeof AddAdminsSchema>) => void;
  onBack: () => void;
}) {
  const [adminEmail, setAdminEmail] = useState("");
  const [admins, setAdmins] = useState<z.infer<typeof UserSchema>[]>([]);

  const handleAddAdmin = async () => {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/user/search?email=" + adminEmail
    );
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.message);
      return;
    }
    const user = UserSchema.parse(data.data);
    setAdmins((prev) => [...prev, user]);
    setAdminEmail("");
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
            <ul className="list-disc list-inside text-sm">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between"
                >
                  {admin.name} ({admin.email})
                  <Button
                    variant="destructive"
                    className="ml-1"
                    onClick={() =>
                      setAdmins((prev) => prev.filter((a) => a.id !== admin.id))
                    }
                  >
                    <X />
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
