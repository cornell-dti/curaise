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
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateFundraiserBody } from "common/schemas/fundraiser";
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
	}
);

export function FundraiserVenmoInfoForm({
	defaultValues,
	onNext,
	onBack,
	onSave,
}: {
	defaultValues: z.infer<typeof VenmoFormSchema>;
	onNext: (data: z.infer<typeof VenmoFormSchema>) => void;
	onBack: () => void;
	onSave: (data: z.infer<typeof VenmoFormSchema>) => void;
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
					autoComplete="off"
					onSubmit={form.handleSubmit((data) => {
						onNext(data);
					})}>
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
					</CardContent>
					<CardFooter className="flex justify-between">
						<Button type="button" variant="outline" onClick={onBack}>
							Back
						</Button>
						<div className="flex gap-2">
							<Button
								onClick={form.handleSubmit(onSave)}
								className="text-[#333F37] border border-current bg-transparent hover:bg-[#e6f0ea]">
								Save
							</Button>
							<Button type="submit">Next</Button>
						</div>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
