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
import { Dispatch, SetStateAction, useState, useEffect } from "react";
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

// Types for tracking pending changes when editing published fundraisers
export type PendingPickupEventChanges = {
	created: { tempId: string; data: z.infer<typeof CreatePickupEventBody> }[];
	updated: { id: string; data: z.infer<typeof CreatePickupEventBody> }[];
	deleted: string[];
};

export function EditPickupEventsForm({
	events,
	setEvents,
	onPendingChanges,
	onSubmit,
	onBack,
	onSave,
}: {
	token: string;
	fundraiserId: string;
	events: z.infer<typeof PickupEventSchema>[];
	setEvents: Dispatch<SetStateAction<z.infer<typeof PickupEventSchema>[]>>;
	onPendingChanges?: (changes: PendingPickupEventChanges) => void;
	onSubmit: () => void;
	onBack: () => void;
	onSave: () => void;
}) {
	// Track pending changes for published fundraisers
	const [pendingChanges, setPendingChanges] =
		useState<PendingPickupEventChanges>({
			created: [],
			updated: [],
			deleted: [],
		});
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

	// Notify when there are pending pickup event changes
	useEffect(() => {
		if (onPendingChanges) {
			onPendingChanges(pendingChanges);
		}
	}, [onPendingChanges, pendingChanges]);

	const handleFormSubmit = async (
		data: z.infer<typeof CreatePickupEventBody>
	) => {
		setIsSubmitting(true);

		// Always store changes locally (not to database yet)

		// If we are add a new pickup event
		if (mode === "add") {
			// Create a temporary event with a temp ID for display
			const tempId = `temp-${Date.now()}`;
			const tempEvent: z.infer<typeof PickupEventSchema> = {
				id: tempId,
				location: data.location,
				startsAt: data.startsAt,
				endsAt: data.endsAt,
			};
			setEvents((prev) => [...prev, tempEvent]);
			setPendingChanges((prev) => ({
				...prev,
				created: [...prev.created, { tempId, data }],
			}));
			toast.success("Pickup event added (will be saved when you finalize)");
		} else if (editingEvent) {
			// Check if this is a temp event (newly created in this session)
			if (editingEvent.id.startsWith("temp-")) {
				// Update the temp event in created array by tempId
				setPendingChanges((prev) => ({
					...prev,
					created: prev.created.map((pending) =>
						pending.tempId === editingEvent.id
							? { tempId: editingEvent.id, data }
							: pending
					),
				}));
			} else {
				// Update an existing pickup event
				setPendingChanges((prev) => ({
					...prev,
					updated: [
						...prev.updated.filter((update) => update.id !== editingEvent.id),
						{ id: editingEvent.id, data },
					],
				}));
			}
			setEvents((prev) =>
				prev.map((evt) =>
					evt.id === editingEvent.id
						? {
								...evt,
								location: data.location,
								startsAt: data.startsAt,
								endsAt: data.endsAt,
						  }
						: evt
				)
			);
			toast.success("Pickup event updated (will be saved when you finalize)");
		}

		setIsSubmitting(false);
		setOpen(false);
		form.reset(DEFAULT_EVENT_VALUES);
	};

	const handleRemoveEvent = (event: z.infer<typeof PickupEventSchema>) => {
		if (events.length <= 1) {
			toast.error("You must have at least one pickup event");
			return;
		}

		// Always store deletion locally
		if (event.id.startsWith("temp-")) {
			// Remove from created array by tempId
			setPendingChanges((prev) => ({
				...prev,
				created: prev.created.filter((pending) => pending.tempId !== event.id),
			}));
		} else {
			// Mark existing event for deletion
			setPendingChanges((prev) => ({
				...prev,
				deleted: [...prev.deleted, event.id],
				// Remove from updated if it was pending update
				updated: prev.updated.filter((update) => update.id !== event.id),
			}));
		}
		setEvents((prev) => prev.filter((evt) => evt.id !== event.id));
		toast.success("Pickup event removed (will be saved when you finalize)");
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
										{format(new Date(event.startsAt), "MMM d, yyyy h:mm a")} -{" "}
										{format(new Date(event.endsAt), "MMM d, yyyy h:mm a")}
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
						Save
					</Button>
					<Button type="button" onClick={onSubmit}>
						Next
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
