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
import { CompleteOrganizationSchema } from "common";
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
  const [additionalAdminEmails, setAdditionalAdminEmails] = useState<string[]>([]);

  const form = useForm<z.infer<typeof UpdateOrganizationBody>>({
    resolver: zodResolver(UpdateOrganizationBody),
    values: {
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl ?? undefined, // Keep this in the form values but don't render the field
      websiteUrl: data.websiteUrl ?? "",
      instagramUsername: data.instagramUsername ?? "",
      addedAdminsEmails: [], // This will be populated with the emails of additional admins
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

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
    if (
      additionalAdminEmails.some((email) => email.toLowerCase() === trimmedEmail.toLowerCase()) ||
      org.admins.some((admin) => admin.email.toLowerCase() === trimmedEmail.toLowerCase())
    ) {
      toast.error("This email is already added as an admin");
      return;
    }

    setAdditionalAdminEmails((prev) => [...prev, trimmedEmail]);
    setAdminEmail("");
    toast.success(`${trimmedEmail} added to list, click save to confirm`);
  };

  const removeAdmin = (emailToRemove: string) => {
    setAdditionalAdminEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  async function onSubmit(formData: z.infer<typeof UpdateOrganizationBody>) {
    // Keep the existing logoUrl in the submission and add admin emails
    const dataToSubmit = {
      ...formData,
      logoUrl: data.logoUrl ?? undefined,
      addedAdminsEmails: additionalAdminEmails,
    };

    try {
      const result = await mutationFetch(`/organization/${org.id}/update`, {
        token,
        body: dataToSubmit,
      });
      setOpen(false);
      setAdditionalAdminEmails([]); // Reset admin list after successful submission
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

                {additionalAdminEmails.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Additional Admins:</p>
                    <ul className="space-y-2">
                      {additionalAdminEmails.map((email) => (
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
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  !form.formState.isDirty && additionalAdminEmails.length === 0
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
