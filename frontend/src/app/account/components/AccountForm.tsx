"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserSchema, UpdateUserBody } from "common";
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
import useSWR from "swr";
import { authFetcher } from "@/lib/fetcher";

export function AccountForm({
  user,
  token,
}: {
  user: z.infer<typeof UserSchema>;
  token: string;
}) {
  const { data, mutate } = useSWR(
    `/user/${user.id}`,
    authFetcher(UserSchema),
    {
      fallbackData: user,
    }
  );

  const form = useForm<z.infer<typeof UpdateUserBody>>({
    resolver: zodResolver(UpdateUserBody),
    values: {
      name: data.name,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  async function onSubmit(formData: z.infer<typeof UpdateUserBody>) {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/user/" + user.id,
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
      mutate({
        ...data,
        ...formData,
      });
      form.reset({ name: formData.name });
      toast.success(result.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit account info</CardTitle>
        <CardDescription>
          Update your account information here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" disabled={!form.formState.isDirty}>
              Save changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
