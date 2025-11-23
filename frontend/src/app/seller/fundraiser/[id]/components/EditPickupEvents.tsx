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
import { PickupEventSchema, CreatePickupEventBody } from "common";
import { Dispatch, SetStateAction, useState } from "react";
import { z } from "zod";
import { PlusCircle, X, MapPin, Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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

const PickupEventFormSchema = CreatePickupEventBody.refine(
	(data) => new Date(data.endsAt) > new Date(data.startsAt),
	{
		message: "End time must be after start time",
		path: ["endsAt"],
	}
);

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

const DEFAULT_EVENT_VALUES = {
	location: "",
	...getDefaultPickupEventDates(),
};

export function EditPickupEventsForm({
	token,
	fundraiserId,
	events,
	setEvents,
	onSubmit,
	onBack,
	onSave,
}: {
	token: string;
	fundraiserId: string;
	events: z.infer<typeof PickupEventSchema>[];
	setEvents: Dispatch<SetStateAction<z.infer<typeof PickupEventSchema>[]>>;
	onSubmit: () => void;
	onBack: () => void;
	onSave: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<"add" | "edit">("add");
	const [editingEvent, setEditingEvent] = useState<z.infer<
		typeof PickupEventSchema
	> | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<z.infer<typeof CreatePickupEventBody>>({
		resolver: zodResolver(PickupEventFormSchema),
		defaultValues: DEFAULT_EVENT_VALUES,
	});

	const openAddDialog = () => {
		setMode("add");
		setEditingEvent(null);
		form.reset(DEFAULT_EVENT_VALUES);
		setOpen(true);
	};

	const openEditDialog = (event: z.infer<typeof PickupEventSchema>) => {
		setMode("edit");
		setEditingEvent(event);
		form.reset({
			location: event.location,
			startsAt: new Date(event.startsAt),
			endsAt: new Date(event.endsAt),
		});
		setOpen(true);
	};

	const createPickupEvent = async (
		data: z.infer<typeof CreatePickupEventBody>
	) => {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/pickup-events/create`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + token,
				},
				body: JSON.stringify(data),
			}
		);

		const result = await response.json();

		if (!response.ok) {
			return {
				success: false as const,
				error: result.message || "Failed to create pickup event",
			};
		}

		return { success: true as const, data: result.data };
	};

	const updatePickupEvent = async (
		eventId: string,
		data: z.infer<typeof CreatePickupEventBody>
	) => {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/pickup-events/${eventId}/update`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + token,
				},
				body: JSON.stringify(data),
			}
		);

		const result = await response.json();

		if (!response.ok) {
			return {
				success: false as const,
				error: result.message || "Failed to update pickup event",
			};
		}

		return { success: true as const, data: result.data };
	};

	const deletePickupEvent = async (eventId: string) => {
		const response = await fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/pickup-events/${eventId}/delete`,
			{
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + token,
				},
			}
		);

		const result = await response.json();

		if (!response.ok) {
			return {
				success: false as const,
				error: result.message || "Failed to delete pickup event",
			};
		}

		return { success: true as const, data: result.data };
	};

	const handleFormSubmit = async (
		data: z.infer<typeof CreatePickupEventBody>
	) => {
		setIsSubmitting(true);

		if (mode === "add") {
			const result = await createPickupEvent(data);
			if (!result.success) {
				toast.error(result.error);
				setIsSubmitting(false);
				return;
			}
			setEvents((prev) => [...prev, result.data]);
			toast.success("Pickup event created");
		} else if (editingEvent) {
			const result = await updatePickupEvent(editingEvent.id, data);
			if (!result.success) {
				toast.error(result.error);
				setIsSubmitting(false);
				return;
			}
			setEvents((prev) =>
				prev.map((e) => (e.id === editingEvent.id ? result.data : e))
			);
			toast.success("Pickup event updated");
		}

		setIsSubmitting(false);
		setOpen(false);
		form.reset(DEFAULT_EVENT_VALUES);
	};

	const handleRemoveEvent = async (
		event: z.infer<typeof PickupEventSchema>
	) => {
		if (events.length <= 1) {
			toast.error("You must have at least one pickup event");
			return;
		}

		const result = await deletePickupEvent(event.id);
		if (!result.success) {
			toast.error(result.error);
			return;
		}

		setEvents((prev) => prev.filter((e) => e.id !== event.id));
		toast.success("Pickup event deleted");
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Pickup Events</CardTitle>
				<CardDescription>
					Manage when and where buyers can pick up their orders. You must have
					at least one pickup event.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex justify-end mb-4">
					<Button onClick={openAddDialog}>
						<PlusCircle className="mr-2 h-4 w-4" />
						Add Pickup Event
					</Button>
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
						{events.map((event) => (
							<div
								key={event.id}
								className="flex items-start justify-between p-4 border rounded-lg">
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<MapPin className="h-4 w-4 text-gray-500" />
										<h4 className="font-medium">{event.location}</h4>
									</div>
									<p className="text-sm text-gray-500 mt-1">
										{format(new Date(event.startsAt), "EEEE, MMMM d, yyyy")}
									</p>
									<p className="text-sm text-gray-500">
										{format(new Date(event.startsAt), "h:mm a")} -{" "}
										{format(new Date(event.endsAt), "h:mm a")}
									</p>
								</div>
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => openEditDialog(event)}
										aria-label="Edit pickup event">
										<Pencil className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => handleRemoveEvent(event)}
										aria-label="Remove pickup event"
										disabled={events.length <= 1}>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				)}

				<Dialog open={open} onOpenChange={setOpen}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>
								{mode === "add" ? "Add Pickup Event" : "Edit Pickup Event"}
							</DialogTitle>
						</DialogHeader>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(handleFormSubmit)}
								className="space-y-4">
								<FormField
									control={form.control}
									name="location"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Location</FormLabel>
											<FormControl>
												<Input placeholder="e.g. Phillips Hall" {...field} />
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

								<DialogFooter>
									<Button
										type="button"
										variant="outline"
										onClick={() => setOpen(false)}>
										Cancel
									</Button>
									<Button type="submit" disabled={isSubmitting}>
										{isSubmitting
											? "Saving..."
											: mode === "add"
												? "Add Event"
												: "Save Changes"}
									</Button>
								</DialogFooter>
							</form>
						</Form>
					</DialogContent>
				</Dialog>
			</CardContent>
			<CardFooter className="flex justify-between">
				<Button variant="outline" onClick={onBack}>
					Back
				</Button>
				<div className="flex gap-2">
					<Button
						onClick={onSave}
						className="text-[#333F37] border border-current bg-transparent hover:bg-[#e6f0ea]">
						Save Draft
					</Button>
					<Button type="button" onClick={onSubmit}>
						Next
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
