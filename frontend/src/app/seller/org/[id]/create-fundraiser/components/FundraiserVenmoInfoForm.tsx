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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateFundraiserBody } from "common/schemas/fundraiser";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const VenmoFormSchema = CreateFundraiserBody.pick({
  venmoUsername: true,
  venmoEmail: true,
}).refine(
  (data) => {
    const hasVenmo = data.venmoUsername || data.venmoEmail;
    const hasBoth = data.venmoUsername && data.venmoEmail;
    return !hasVenmo || hasBoth;
  },
  {
    message:
      "Both Venmo username and email must be provided together, or both must be empty",
    path: ["venmoUsername", "venmoEmail"],
  },
);

export function FundraiserVenmoInfoForm({
  defaultValues,
  defaultSkipVenmo,
  onNext,
  onBack,
  onSave,
  onSkipVenmoChange,
  isSubmitting,
}: {
  defaultValues: z.infer<typeof VenmoFormSchema>;
  defaultSkipVenmo?: boolean;
  onNext: (data: z.infer<typeof VenmoFormSchema>, skipVenmo: boolean) => void;
  onBack: () => void;
  onSave: (data: z.infer<typeof VenmoFormSchema>, skipVenmo: boolean) => void;
  onSkipVenmoChange?: (skipVenmo: boolean) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<z.infer<typeof VenmoFormSchema>>({
    resolver: zodResolver(VenmoFormSchema),
    defaultValues: defaultValues,
  });
  const [skipVenmo, setSkipVenmo] = useState(defaultSkipVenmo ?? false);

  useEffect(() => {
    setSkipVenmo(defaultSkipVenmo ?? false);
  }, [defaultSkipVenmo]);

  const updateSkipVenmo = (nextSkipVenmo: boolean) => {
    setSkipVenmo(nextSkipVenmo);
    onSkipVenmoChange?.(nextSkipVenmo);

    if (nextSkipVenmo) {
      form.setValue("venmoUsername", "");
      form.setValue("venmoEmail", "");
      form.clearErrors(["venmoUsername", "venmoEmail"]);
    }
  };

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
          autoComplete="off"
          onSubmit={form.handleSubmit((data) => {
            onNext(data, skipVenmo);
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
                        if (value && skipVenmo) {
                          updateSkipVenmo(false);
                        }
                        field.onChange(value);
                      }}
                      disabled={skipVenmo}
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
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value || "";
                        if (value && skipVenmo) {
                          updateSkipVenmo(false);
                        }
                        field.onChange(value);
                      }}
                      disabled={skipVenmo}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button
              type="button"
              onClick={() => {
                updateSkipVenmo(!skipVenmo);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
                "hover:border-[#265B34] hover:bg-green-50/50",
                skipVenmo
                  ? "border-[#265B34] bg-green-50"
                  : "border-border bg-background",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                  skipVenmo
                    ? "border-[#265B34] bg-[#265B34] text-white"
                    : "border-muted-foreground/40 bg-background",
                )}
              >
                {skipVenmo && <Check className="h-3.5 w-3.5" />}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  This fundraiser will not use Venmo
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Check this if donations for this fundraiser will be handled
                  without Venmo.
                </p>
              </div>
            </button>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={form.handleSubmit((data) => onSave(data, skipVenmo))}
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
