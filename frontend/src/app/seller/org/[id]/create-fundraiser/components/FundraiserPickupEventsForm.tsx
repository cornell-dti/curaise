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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreatePickupEventBody } from "common";
import { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
import { PlusCircle, X, MapPin, Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DateTimePicker } from "@/components/custom/DateTimePicker";
import { format } from "date-fns";
import { ControllerRenderProps } from "react-hook-form";

const DateTimeFieldAdapter = ({
	field,
}: {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	field: ControllerRenderProps<any, any>;
}) => {
	return <DateTimePicker value={field.value} onChange={field.onChange} />;
};

// This enhances the original schema, prevents users from putting invalid end time
// End time must be after start time
const PickupEventFormSchema = CreatePickupEventBody.refine(
	(data) => new Date(data.endsAt) > new Date(data.startsAt),
	{
		message: "End time must be after start time",
		path: ["endsAt"],
	}
);

// Default values
// e.g Today is December 5
// StartsAt -> December 6, 9 AM
// EndsAt -> December 6, 10 PM
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

export function FundraiserPickupEventsForm({
	events,
	setEvents,
	onNext,
	onBack,
	onSave,
}: {
	events: z.infer<typeof CreatePickupEventBody>[];
	setEvents: Dispatch<SetStateAction<z.infer<typeof CreatePickupEventBody>[]>>;
	onNext: () => void;
	onBack: () => void;
	onSave: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<"add" | "edit">("add");
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const form = useForm<z.infer<typeof CreatePickupEventBody>>({
		resolver: zodResolver(PickupEventFormSchema),
		defaultValues: {
			location: "",
			...getDefaultPickupEventDates(),
		},
	});

	// Ths handles either add or edit of the pickup event depending on the "mode"
	const handleSubmit = (data: z.infer<typeof CreatePickupEventBody>) => {
		if (mode === "add") {
			setEvents((prev) => [...prev, data]);
		} else if (editingIndex !== null) {
			setEvents((prev) =>
				prev.map((event, idx) => (idx === editingIndex ? data : event))
			);
		}
		setOpen(false);
		form.reset({
			location: "",
			...getDefaultPickupEventDates(),
		});
	};

	const handleEditEvent = (index: number) => {
		setMode("edit");
		setEditingIndex(index);
		const event = events[index];
		form.reset({
			location: event.location,
			startsAt: new Date(event.startsAt),
			endsAt: new Date(event.endsAt),
		});
		setOpen(true);
	};

	const handleRemoveEvent = (index: number) => {
		setEvents((prev) => prev.filter((_, idx) => idx !== index));
	};

	const handleDialogChange = (isOpen: boolean) => {
		setOpen(isOpen);
		// Reset form when dialog is closed
		if (!isOpen) {
			form.reset({
				location: "",
				...getDefaultPickupEventDates(),
			});
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Add Pickup Events</CardTitle>
				<CardDescription>
					Add pickup events for when and where buyers can pick up their orders.
					You can always add more pickup events after creating the fundraiser.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex justify-end mb-4">
					<Dialog open={open} onOpenChange={handleDialogChange}>
						<DialogTrigger asChild>
							<Button
								onClick={() => {
									setMode("add");
									setEditingIndex(null);
								}}>
								<PlusCircle className="mr-2 h-4 w-4" />
								Add Pickup Event
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-2xl">
							<Form {...form}>
								<form onSubmit={form.handleSubmit(handleSubmit)}>
									<DialogHeader>
										<DialogTitle>
											{mode === "add"
												? "Add Pickup Event"
												: "Edit Pickup Event"}
										</DialogTitle>
									</DialogHeader>
									<div className="grid gap-4 py-4">
										<FormField
											control={form.control}
											name="location"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Location</FormLabel>
													<FormControl>
														<Input
															placeholder="e.g. Phillips Hall"
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
												name="startsAt"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Start Time</FormLabel>
														<FormControl>
															<DateTimeFieldAdapter field={field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>

											<FormField
												control={form.control}
												name="endsAt"
												render={({ field }) => (
													<FormItem>
														<FormLabel>End Time</FormLabel>
														<FormControl>
															<DateTimeFieldAdapter field={field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
										</div>
									</div>
									<DialogFooter>
										<Button type="submit">
											{mode === "add" ? "Add Event" : "Save Changes"}
										</Button>
									</DialogFooter>
								</form>
							</Form>
						</DialogContent>
					</Dialog>
				</div>

				{events.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
						<MapPin className="w-12 h-12 text-gray-400 mb-4" />
						<p className="text-sm text-gray-500">
							No pickup events added yet. Click &quot;Add Pickup Event&quot; to
							create one.
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{events.map((event, index) => (
							<div
								key={index}
								className="flex items-start justify-between p-4 border rounded-lg">
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<MapPin className="h-4 w-4 text-gray-500" />
										<h4 className="font-medium">{event.location}</h4>
									</div>
									<p className="text-sm text-gray-500 mt-1">
										{format(new Date(event.startsAt), "MMM d, yyyy h:mm a")} -{" "}
										{format(new Date(event.endsAt), "MMM d, yyyy h:mm a")}
									</p>
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleEditEvent(index)}
										aria-label="Edit pickup event">
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveEvent(index)}
										aria-label="Remove pickup event">
										<X className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
			<CardFooter className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<div className="flex gap-2">
					<Button
						onClick={onSave}
						className="text-[#333F37] border border-current bg-transparent hover:bg-[#e6f0ea]">
						Save
					</Button>
					<Button type="button" onClick={onNext}>
						Next
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
