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
import { Dialog } from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateFundraiserBody } from "common/schemas/fundraiser";
import { useForm } from "react-hook-form";
import { z } from "zod";

const VenmoFormSchema = CreateFundraiserBody.pick({
  venmoUsername: true,
  venmoEmail: true,
});

export function FundraiserVenmoVerifyForm({
  defaultValues,
  onSubmit,
  onBack,
}: {
  defaultValues: z.infer<typeof VenmoFormSchema>;
  onSubmit: (data: z.infer<typeof VenmoFormSchema>) => void;
  onBack: () => void;
}) {
  const form = useForm<z.infer<typeof VenmoFormSchema>>({
    resolver: zodResolver(VenmoFormSchema),
    defaultValues: defaultValues,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Venmo Information</CardTitle>
        <CardDescription>
          Add the Venmo email and username of the organizer who the buyers will
          be paying to.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => {
            onSubmit(data);
          })}
        >
          <CardContent className="space-y-2">
            <FormField
              control={form.control}
              name="venmoUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venmo Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Venmo Username"
                      {...field}
                      value={field.value?.toString() || ""}
                      onChange={(e) => {
                        const value = e.target.value
                          ? e.target.value
                          : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="venmoEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venmo Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Venmo Email"
                      {...field}
                      value={field.value?.toString() || ""}
                      onChange={(e) => {
                        const value = e.target.value
                          ? e.target.value
                          : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">Next</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
