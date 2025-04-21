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
import { DateTimePicker } from "@/components/custom/DateTimePicker";
import { ControllerRenderProps } from "react-hook-form";
import { useState, useEffect } from "react";
import UploadImageComponent from "@/components/custom/UploadImageComponent";

const BasicInformationSchema = CreateFundraiserBody.omit({
  // imageUrls: true,
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
      // Check if pickup end date is after pickup start date
      if (data.pickupStartsAt && data.pickupEndsAt) {
        return new Date(data.pickupEndsAt) > new Date(data.pickupStartsAt);
      }
      return true;
    },
    {
      message: "Pickup end date must be after pickup start date",
      path: ["pickupEndsAt"],
    }
  );

// Adapter component that connects react-hook-form field to DateTimePicker
const DateTimeFieldAdapter = ({
  field,
}: {
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
  // State for fundraisers image urls
    const [currentImageUrls, setCurrentImageUrls] =
      useState<z.infer<typeof CreateFundraiserBody>["imageUrls"]>([]);
  
  const form = useForm<z.infer<typeof BasicInformationSchema>>({
    resolver: zodResolver(BasicInformationSchema),
    defaultValues: defaultValues,
  });

  // Update form when image URL changes
    useEffect(() => {
      if (currentImageUrls) {
        form.setValue("imageUrls", currentImageUrls);
      }
    }, [currentImageUrls, form]);

  return (
		<Card>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit((data) => {
						onSubmit(data);
					})}>
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
										setImageUrl={setCurrentImageUrls}
										folder="fundraisers"
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

						<FormField
							control={form.control}
							name="pickupLocation"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Pickup Location</FormLabel>
									<FormControl>
										<Input placeholder="Where items are picked up" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p className="mb-2 font-medium">Buying Period</p>
								<div className="space-y-2">
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
								<p className="mb-2 font-medium">Pickup Period</p>
								<div className="space-y-2">
									<FormField
										control={form.control}
										name="pickupStartsAt"
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
										name="pickupEndsAt"
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
