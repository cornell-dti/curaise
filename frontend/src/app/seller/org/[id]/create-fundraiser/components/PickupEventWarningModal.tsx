"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, MapPin } from "lucide-react";
import { CreatePickupEventBody } from "common";
import { z } from "zod";
import { format } from "date-fns";

export function PickupEventWarningModal({
	open,
	onClose,
	onConfirm,
	conflictingEvents,
}: {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	conflictingEvents: z.infer<typeof CreatePickupEventBody>[];
}) {
	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-destructive">
						<AlertTriangle className="h-5 w-5" />
						Pickup Time Overlap Detected
					</DialogTitle>
				</DialogHeader>
				<div className="py-2">
					<p className="text-sm text-muted-foreground mb-3">
						This pickup event overlaps with the following existing event
						{conflictingEvents.length > 1 ? "s" : ""}:
					</p>
					<div className="space-y-2">
						{conflictingEvents.map((event, i) => (
							<div
								key={i}
								className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
								<MapPin className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
								<div>
									<p className="text-sm font-medium">{event.location}</p>
									<p className="text-xs text-muted-foreground">
										{format(new Date(event.startsAt), "MMM d, yyyy h:mm a")} –{" "}
										{format(new Date(event.endsAt), "MMM d, yyyy h:mm a")}
									</p>
								</div>
							</div>
						))}
					</div>
					<p className="text-sm text-muted-foreground mt-3">
						Please adjust the start or end time of this pickup event to avoid
						conflicts, or add it anyway.
					</p>
				</div>
				<DialogFooter className="gap-2">
					<Button variant="outline" onClick={onClose}>
						Go Back and Fix
					</Button>
					<Button variant="destructive" onClick={onConfirm}>
						Add Anyway
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
