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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateFundraiserBody } from "common/schemas/fundraiser";
import { useForm } from "react-hook-form";
import { z } from "zod";

const VenmoFormSchema = CreateFundraiserBody.pick({
  venmoUsername: true,
  venmoEmail: true,
  venmoLastFourDigits: true,
}).refine(
  (data) => {
    const hasVenmo =
      data.venmoUsername || data.venmoEmail || data.venmoLastFourDigits;
    const hasAll =
      data.venmoUsername && data.venmoEmail && data.venmoLastFourDigits;
    return !hasVenmo || hasAll;
  },
  {
    message: "All Venmo fields must be provided together, or all must be empty",
    path: ["venmoUsername", "venmoEmail", "venmoLastFourDigits"],
  },
);

export function FundraiserVenmoInfoForm({
  defaultValues,
  onNext,
  onBack,
  onSave,
  isSubmitting,
}: {
  defaultValues: z.infer<typeof VenmoFormSchema>;
  onNext: (data: z.infer<typeof VenmoFormSchema>) => void;
  onBack: () => void;
  onSave: (data: z.infer<typeof VenmoFormSchema>) => void;
  isSubmitting: boolean;
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
          Add the Venmo email, username, and last four digits of the organizer
          who the buyers will be paying to.
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form
          autoComplete="off"
          onSubmit={form.handleSubmit((data) => {
            onNext(data);
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
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value || "";
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
                  <FormDescription>
                    This is your Venmo account&apos;s email address, not
                    necessarily your Cornell email address!
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Venmo Email"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value || "";
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
              name="venmoLastFourDigits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Venmo Phone Number Last Four Digits (For Verification)
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234"
                      maxLength={4}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value || "";
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
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={form.handleSubmit(onSave)}
                className="text-[#333F37] border border-current bg-transparent hover:bg-[#e6f0ea]"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Save"}
              </Button>
              <Button type="submit">Next</Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
