"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CompleteOrganizationSchema, UserSchema } from "common";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useState } from "react";
import useSWR from "swr";
import { authFetcher, serverFetch, mutationFetch } from "@/lib/fetcher";
import { UpdateOrganizationBody } from "common";
import { X } from "lucide-react";

export function EditOrgInfoDialog({
  org,
  token,
}: {
  org: z.infer<typeof CompleteOrganizationSchema>;
  token: string;
}) {
  const { data, error, mutate } = useSWR(
    `/organization/${org.id}`,
    authFetcher(CompleteOrganizationSchema),
    {
      fallbackData: org,
    }
  );

  const [open, setOpen] = useState(false);
  // Admin management states
  const [adminEmail, setAdminEmail] = useState("");
  const [additionalAdmins, setAdditionalAdmins] = useState<
    z.infer<typeof UserSchema>[]
  >([]);

  const form = useForm<z.infer<typeof UpdateOrganizationBody>>({
    resolver: zodResolver(UpdateOrganizationBody),
    values: {
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl ?? undefined, // Keep this in the form values but don't render the field
      websiteUrl: data.websiteUrl ?? "",
      instagramUsername: data.instagramUsername ?? "",
      addedAdminsIds: [], // This will be populated with the IDs of additional admins
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) {
      toast.error("Please enter an admin email");
      return;
    }

    try {
      const user = await serverFetch(
        `/user/search?email=${encodeURIComponent(adminEmail)}`,
        { schema: UserSchema }
      );

      // Check if admin is already in the list
      if (
        additionalAdmins.some((admin) => admin.id === user.id) ||
        org.admins.some((admin) => admin.id === user.id)
      ) {
        toast.error("This user is already added as an admin");
        return;
      }

      setAdditionalAdmins((prev) => [...prev, user]);
      setAdminEmail("");
      toast.success(`${user.name} added to list, click save to confirm`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error adding admin");
    }
  };

  const removeAdmin = (adminId: string) => {
    setAdditionalAdmins((prev) => prev.filter((admin) => admin.id !== adminId));
  };

  async function onSubmit(formData: z.infer<typeof UpdateOrganizationBody>) {
    // Keep the existing logoUrl in the submission and add admin IDs
    const dataToSubmit = {
      ...formData,
      logoUrl: data.logoUrl ?? undefined,
      addedAdminsIds: additionalAdmins.map((admin) => admin.id),
    };

    try {
      const result = await mutationFetch(`/organization/${org.id}/update`, {
        token,
        body: dataToSubmit,
      });
      setOpen(false);
      setAdditionalAdmins([]); // Reset admin list after successful submission
      mutate({
        ...data,
        ...dataToSubmit,
      });
      form.reset();
      toast.success(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update organization");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Organization Info</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>
            <DialogHeader>
              <DialogTitle>Edit organization info</DialogTitle>
              <DialogDescription>
                Make changes to your organization here. Click save when
                you&apos;re done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Organization Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your organization"
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instagramUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram Username (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="username (without @)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Add Admins Section */}
              <div className="border-t pt-4 mt-2">
                <FormLabel className="block mb-2">
                  Add Additional Admins (Optional)
                </FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Admin Email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddAdmin}>
                    Add
                  </Button>
                </div>

                {additionalAdmins.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Additional Admins:</p>
                    <ul className="space-y-2">
                      {additionalAdmins.map((admin) => (
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
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  !form.formState.isDirty && additionalAdmins.length === 0
                }
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
