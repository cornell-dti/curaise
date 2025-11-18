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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateFundraiserBody } from "common";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { DateTimePicker } from "@/components/custom/DateTimePicker";
import { ControllerRenderProps } from "react-hook-form";
import UploadImageComponent from "@/components/custom/UploadImageComponent";
import { Plus, Trash2 } from "lucide-react";

const BasicInformationSchema = CreateFundraiserBody.omit({
  organizationId: true,
})
  .refine(
    (data) => {
      // Check if buying end date is after buying start date
      if (data.buyingStartsAt && data.buyingEndsAt) {
        return new Date(data.buyingEndsAt) > new Date(data.buyingStartsAt);
      }
      return true;
    },
    {
      message: "Buying end date must be after buying start date",
      path: ["buyingEndsAt"],
    }
  )
  .refine(
    (data) => {
      // Check if all pickup events have valid date ranges
      return data.pickupEvents.every(
        (event) => new Date(event.endsAt) > new Date(event.startsAt)
      );
    },
    {
      message: "Pickup end date must be after pickup start date for all events",
      path: ["pickupEvents"],
    }
  );

// Adapter component that connects react-hook-form field to DateTimePicker
const DateTimeFieldAdapter = ({
  field,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: ControllerRenderProps<any, any>;
}) => {
  return <DateTimePicker value={field.value} onChange={field.onChange} />;
};

export function FundraiserBasicInfoForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues: z.infer<typeof BasicInformationSchema>;
  onSubmit: (data: z.infer<typeof BasicInformationSchema>) => void;
}) {
  const form = useForm<z.infer<typeof BasicInformationSchema>>({
    resolver: zodResolver(BasicInformationSchema),
    defaultValues: defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "pickupEvents",
  });

  const getDefaultPickupEventDates = () => {
    const now = new Date();
    const startsAt = new Date(now);
    startsAt.setDate(now.getDate() + 1);
    startsAt.setHours(9, 0, 0, 0);

    const endsAt = new Date(now);
    endsAt.setDate(now.getDate() + 1);
    endsAt.setHours(22, 0, 0, 0);

    return { startsAt, endsAt };
  };

  return (
    <Card>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => {
            onSubmit(data);
          })}
        >
          <CardHeader>
            <CardTitle>Fundraiser Information</CardTitle>
            <CardDescription>
              Provide the basic information about your fundraiser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Fundraiser Name" {...field} />
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
                      placeholder="Describe your fundraiser..."
                      {...field}
                      className="min-h-24"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrls"
              render={() => (
                <FormItem>
                  <FormLabel>Images (Optional)</FormLabel>
                  <UploadImageComponent
                    imageUrls={form.getValues("imageUrls")}
                    setImageUrls={(imageUrls: string[]) => {
                      form.setValue("imageUrls", imageUrls);
                    }}
                    folder="fundraisers"
                    allowMultiple
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Amount (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0.00"
                      value={field.value?.toString() || ""}
                      onChange={(e) => {
                        const value = e.target.value
                          ? parseFloat(e.target.value)
                          : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <p className="mb-2 font-medium">Buying Period</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buyingStartsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DateTimeFieldAdapter field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buyingEndsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DateTimeFieldAdapter field={field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Pickup Events</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const dates = getDefaultPickupEventDates();
                    append({
                      location: "",
                      startsAt: dates.startsAt,
                      endsAt: dates.endsAt,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Event
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-4 p-4 border rounded-lg relative"
                  >
                    <div className="flex items-center justify-between mb-2">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`pickupEvents.${index}.location`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Where items are picked up"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`pickupEvents.${index}.startsAt`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <DateTimeFieldAdapter field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`pickupEvents.${index}.endsAt`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <DateTimeFieldAdapter field={field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Next</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
