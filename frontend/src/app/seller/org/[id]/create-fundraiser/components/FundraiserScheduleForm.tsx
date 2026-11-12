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
import { PickupEventWarningModal } from "./PickupEventWarningModal";
import { PickupOverlapWarning } from "./PickupOverlapWarning";
import {
  BuyingPeriod,
  BuyingPeriodFields,
  BuyingPeriodSchema,
} from "./BuyingPeriodFields";
import {
  findOverlappingFundraisers,
  timeRangesOverlap,
} from "@/lib/pickup-overlap";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CreatePickupEventBody,
} from "common";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { Calendar, PlusCircle, X, MapPin, Pencil } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DateTimePicker } from "@/components/custom/DateTimePicker";
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";
import { CalendarView } from "@/app/buyer/browse/components/CalendarView";
import { cn } from "@/lib/utils";
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

type PickupEvent = z.infer<typeof CreatePickupEventBody>;

// This enhances the original schema, prevents users from putting invalid end time
// End time must be after start time
const PickupEventFormSchema = CreatePickupEventBody.refine(
  (data) => new Date(data.endsAt) > new Date(data.startsAt),
  {
    message: "End time must be after start time",
    path: ["endsAt"],
  },
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

const getOverlapWarningKey = (event: PickupEvent) =>
  `${event.location}|${event.startsAt.getTime()}|${event.endsAt.getTime()}`;

export function FundraiserScheduleForm({
  defaultValues,
  events,
  setEvents,
  otherFundraisers,
  organizations,
  onNext,
  onBack,
  onSave,
  isSubmitting,
}: {
  defaultValues: BuyingPeriod;
  events: PickupEvent[];
  setEvents: Dispatch<SetStateAction<PickupEvent[]>>;
  otherFundraisers: z.infer<typeof BasicFundraiserSchema>[];
  organizations: z.infer<typeof BasicOrganizationSchema>[];
  onNext: (data: BuyingPeriod) => void;
  onBack: (data?: BuyingPeriod) => void;
  onSave: (data: BuyingPeriod) => void;
  isSubmitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);
  const [conflictingEvents, setConflictingEvents] = useState<PickupEvent[]>(
    [],
  );
  const [pendingEvent, setPendingEvent] = useState<PickupEvent | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [calendarFocusCount, setCalendarFocusCount] = useState(0);
  const [dismissedOverlapWarnings, setDismissedOverlapWarnings] = useState<
    Set<string>
  >(() => new Set());
  const calendarRef = useRef<HTMLDivElement>(null);

  const buyingPeriodForm = useForm<BuyingPeriod>({
    resolver: zodResolver(BuyingPeriodSchema),
    defaultValues,
  });

  const form = useForm<PickupEvent>({
    resolver: zodResolver(PickupEventFormSchema),
    defaultValues: {
      location: "",
      ...getDefaultPickupEventDates(),
    },
  });

  useEffect(() => {
    if (calendarFocusCount > 0) {
      calendarRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [calendarFocusCount]);

  const toggleCalendar = () => {
    if (!calendarOpen) {
      setCalendarDate(
        buyingPeriodForm.getValues("buyingStartsAt") ?? new Date(),
      );
    }
    setCalendarOpen(!calendarOpen);
  };

  const showInCalendar = (date: Date) => {
    setCalendarDate(date);
    setCalendarOpen(true);
    setCalendarFocusCount((count) => count + 1);
  };

  const dismissOverlapWarning = (key: string) => {
    setDismissedOverlapWarnings((prev) => new Set(prev).add(key));
  };

  // Ths handles either add or edit of the pickup event depending on the "mode"
  const handleSubmit = (data: PickupEvent) => {
    // When adding a new pickup event, we want to make sure the new event does not conflict with existing events
    // When editing an existing pickup event, we want to make sure the updated event does not conflict with existing events (excluding the original event)
    const conflicts = events.filter((event, idx) => {
      if (mode === "edit" && idx === editingIndex) return false;
      return timeRangesOverlap(data, event);
    });

    if (conflicts.length > 0) {
      setConflictingEvents(conflicts);
      setPendingEvent(data);
      setWarningOpen(true);
      return;
    }

    commitEvent(data);
  };

  // This commits the pickup event to the state, either by adding a new event or updating an existing event based on the "mode"
  const commitEvent = (data: PickupEvent) => {
    if (mode === "add") {
      setEvents((prev) => [...prev, data]);
    } else if (editingIndex !== null) {
      setEvents((prev) =>
        prev.map((event, idx) => (idx === editingIndex ? data : event)),
      );
    }
    setOpen(false);
    form.reset({
      location: "",
      ...getDefaultPickupEventDates(),
    });
  };

  const handleConfirmAnyway = () => {
    if (pendingEvent) {
      commitEvent(pendingEvent);
      setPendingEvent(null);
    }
    setWarningOpen(false);
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
    <>
      <Card>
        <CardHeader className="flex-col gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>Schedule Times</CardTitle>
            <CardDescription>
              View other fundraiser schedules to help plan your event without
              conflict.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={toggleCalendar}
            aria-expanded={calendarOpen}
            className={cn(
              "shrink-0 self-start border border-[#265B34]",
              calendarOpen
                ? "bg-[#265B34] text-white hover:bg-[#1f4a2b]"
                : "bg-transparent text-[#265B34] hover:bg-[#e6f0ea]",
            )}>
            <Calendar className="mr-2 h-4 w-4" />
            {calendarOpen ? "Close Calendar" : "Open Calendar"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {calendarOpen && (
            <div ref={calendarRef} className="scroll-mt-24">
              <CalendarView
                key={calendarFocusCount}
                organizations={organizations}
                fundraisers={otherFundraisers}
                selectedDate={calendarDate}
                onSelectedDateChange={setCalendarDate}
                variant="embedded"
              />
            </div>
          )}

          <BuyingPeriodFields form={buyingPeriodForm} />

          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="font-medium flex items-center">
                Add Pickup Events{" "}
                <InfoTooltip content="When and where buyers can pick up their orders. You can always add more pickup events after creating the fundraiser." />
              </p>
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
                  No pickup events added yet. Click &quot;Add Pickup Event&quot;
                  to create one.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => {
                  const overlappingFundraisers = findOverlappingFundraisers(
                    event,
                    otherFundraisers,
                  );
                  const warningKey = getOverlapWarningKey(event);

                  return (
                    <div key={index} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <h4 className="font-medium">{event.location}</h4>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {format(
                              new Date(event.startsAt),
                              "MMM d, yyyy h:mm a",
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(event.endsAt),
                              "MMM d, yyyy h:mm a",
                            )}
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
                      {overlappingFundraisers.length > 0 &&
                        !dismissedOverlapWarnings.has(warningKey) && (
                          <PickupOverlapWarning
                            fundraisers={overlappingFundraisers}
                            onViewCalendar={() =>
                              showInCalendar(event.startsAt)
                            }
                            onDismiss={() => dismissOverlapWarning(warningKey)}
                          />
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={buyingPeriodForm.handleSubmit(onBack, () => onBack())}
          >
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={buyingPeriodForm.handleSubmit(onSave)}
              className="text-[#333F37] border border-current bg-transparent hover:bg-[#e6f0ea]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Save"}
            </Button>
            <Button type="button" onClick={buyingPeriodForm.handleSubmit(onNext)}>
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>

      <PickupEventWarningModal
        open={warningOpen}
        onClose={() => setWarningOpen(false)}
        onConfirm={handleConfirmAnyway}
        conflictingEvents={conflictingEvents}
      />
    </>
  );
}
