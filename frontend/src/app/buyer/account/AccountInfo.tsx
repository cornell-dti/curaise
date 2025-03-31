"use client";

import useSWR from "swr";
import { UpdateUserBody, UserSchema } from "common";
import { z } from "zod";
import { authFetcher } from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AccountInfo = ({
  user,
  token,
}: {
  user: z.infer<typeof UserSchema>;
  token: string;
}) => {
  const { data, error, mutate } = useSWR(
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
      toast.success(result.message);
      mutate();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((formData) => onSubmit(formData))}>
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
        <Button className="w-full" type="submit">
          Save
        </Button>
      </form>
    </Form>
  );
};

export default AccountInfo;
