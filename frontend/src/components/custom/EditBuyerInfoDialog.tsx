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
import { Label } from "@/components/ui/label";
import { UserSchema, UpdateUserBody } from "common";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { authFetcher } from "@/lib/fetcher";

export function EditBuyerInfoDialog({
  user,
  token,
}: {
  user: z.infer<typeof UserSchema>;
  token: string;
}) {
  const { data, error, mutate } = useSWR(
    `/user/${user.id}`,
    authFetcher(UserSchema),
    {
      fallbackData: user,
    }
  );

  const router = useRouter();

  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof UpdateUserBody>>({
    resolver: zodResolver(UpdateUserBody),
    values: {
      name: data.name,
      venmoUsername: data.venmoUsername ?? "",
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  async function onSubmit(data: z.infer<typeof UpdateUserBody>) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/user/" + user.id,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(data, (key, value) => {
          if (value === undefined) {
            return "";
          }
          return value;
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      toast.error(result.message);
      return;
    } else {
      mutate();
      router.refresh();
      form.reset();
      setOpen(false);
      toast.success(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Info</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>
            <DialogHeader>
              <DialogTitle>Edit account info</DialogTitle>
              <DialogDescription>
                Make changes to your account here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="venmoUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venmo Username</FormLabel>
                    <FormControl>
                      <Input placeholder="No Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
