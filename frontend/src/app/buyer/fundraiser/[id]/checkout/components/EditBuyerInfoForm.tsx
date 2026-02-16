"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useState } from "react";
import useSWR from "swr";
import { authFetcher, mutationFetch } from "@/lib/fetcher";

export function EditBuyerInfoForm({
  user,
  token,
  onNext,
}: {
  user: z.infer<typeof UserSchema>;
  token: string;
  onNext: () => void;
}) {
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
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  async function onSubmit(formData: z.infer<typeof UpdateUserBody>) {
    if (!form.formState.isDirty) {
      onNext();
      return;
    }

    try {
      const result = await mutationFetch(`/user/${user.id}`, {
        token,
        body: formData,
      });
      mutate({
        ...data,
        ...formData,
      });
      form.reset();
      toast.success(result.message);
      onNext();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data))}>
          <CardHeader>
            <CardTitle>Confirm account info</CardTitle>
            <CardDescription>
              Please confirm your account information for this order.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              onClick={form.handleSubmit((data) => {
                onSubmit(data);
              })}
            >
              Next
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
