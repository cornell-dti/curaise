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
import { useForm } from "react-hook-form";
import { z } from "zod";
import UploadImageComponent from "@/components/custom/UploadImageComponent";
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";

const BasicInformationSchema = CreateFundraiserBody.omit({
  organizationId: true,
  pickupEvents: true,
  buyingStartsAt: true,
  buyingEndsAt: true,
});

export function FundraiserBasicInfoForm({
  defaultValues,
  onNext,
  onSave,
  isSubmitting,
}: {
  defaultValues: z.infer<typeof BasicInformationSchema>;
  onNext: (data: z.infer<typeof BasicInformationSchema>) => void;
  onSave: (data: z.infer<typeof BasicInformationSchema>) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<z.infer<typeof BasicInformationSchema>>({
    resolver: zodResolver(BasicInformationSchema),
    defaultValues: defaultValues,
  });

  return (
    <Card>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => {
            onNext(data);
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
                  <FormLabel className="flex items-center">
                    Goal Amount (Optional){" "}
                    <InfoTooltip content="The amount of total profit you want to raise (INCLUDING expenses)." />
                  </FormLabel>
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
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              onClick={form.handleSubmit(onSave)}
              className="text-[#333F37] border border-current bg-transparent hover:bg-[#e6f0ea]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Save"}
            </Button>
            <Button type="submit">Next</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
