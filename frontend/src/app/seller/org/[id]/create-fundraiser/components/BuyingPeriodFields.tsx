"use client";

import { UseFormReturn } from "react-hook-form";
import { CreateFundraiserBody } from "common";
import { z } from "zod";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { DateTimePicker } from "@/components/custom/DateTimePicker";
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";

export const BuyingPeriodSchema = CreateFundraiserBody.pick({
	buyingStartsAt: true,
	buyingEndsAt: true,
}).refine(
	(data) => new Date(data.buyingEndsAt) > new Date(data.buyingStartsAt),
	{
		message: "Buying end date must be after buying start date",
		path: ["buyingEndsAt"],
	},
);

export type BuyingPeriod = z.infer<typeof BuyingPeriodSchema>;

export function BuyingPeriodFields({
	form,
}: {
	form: UseFormReturn<BuyingPeriod>;
}) {
	return (
		<Form {...form}>
			<div>
				<p className="mb-2 font-medium flex items-center">
					Buying Period{" "}
					<InfoTooltip content="This is the time period you want customers to be able to order an item for this fundraiser. After this time period is past, users will NOT be able to order from this fundraiser." />
				</p>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<FormField
						control={form.control}
						name="buyingStartsAt"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Start Date</FormLabel>
								<FormControl>
									<DateTimePicker value={field.value} onChange={field.onChange} />
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
									<DateTimePicker value={field.value} onChange={field.onChange} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</div>
		</Form>
	);
}
