import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CartItem } from "@/lib/store/useCartStore";
import { CompleteFundraiserSchema, CreateOrderBody } from "common";
import { format } from "date-fns";
import Decimal from "decimal.js";
import { CalendarIcon, MapPin } from "lucide-react";
import { z } from "zod";

export function ReviewOrderForm({
	fundraiser,
	cartItems,
	onSubmit,
	onBack,
	isSubmitting,
}: {
	fundraiser: z.infer<typeof CompleteFundraiserSchema>;
	cartItems: CartItem[];
	onSubmit: () => void;
	onBack: () => void;
	isSubmitting: boolean;
}) {
	const orderTotal = cartItems
		.reduce(
			(total, item) =>
				total.plus(Decimal(item.item.price).times(item.quantity)),
			new Decimal(0),
		)
		.toFixed(2);

	return (
		<div className="container max-w-4xl py-6 px-4 md:py-8 md:px-6 mx-auto">
			<div className="grid gap-6">
				{/* Pickup Info Card */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-start space-y-0 pb-2">
						<CardTitle>Pickup Events</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{fundraiser.pickupEvents.map((event) => (
								<div key={event.id} className="space-y-2">
									<div className="flex items-start gap-2">
										<MapPin
											className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5"
											aria-hidden="true"
										/>
										<span className="text-sm">
											<b>{event.location}</b>
										</span>
									</div>
									<div className="flex items-start gap-2">
										<CalendarIcon
											className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5"
											aria-hidden="true"
										/>
										<span className="text-sm">
											<b>
												{format(event.startsAt, "MMM d, yyyy 'at' h:mm a")} -{" "}
												{format(event.endsAt, "MMM d, yyyy 'at' h:mm a")}
											</b>
										</span>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Order Items Card */}
				<Card>
					<CardHeader>
						<CardTitle>Order Items</CardTitle>
						<CardDescription>
							{cartItems.reduce((total, item) => total + item.quantity, 0)}{" "}
							items purchased
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{cartItems.map((orderItem) => (
								<div
									key={orderItem.item.id}
									className="flex flex-col sm:flex-row gap-4 pb-4 border-b last:border-0 last:pb-0">
									<div className="flex-1 space-y-1 text-center sm:text-left">
										<h3 className="font-medium">{orderItem.item.name}</h3>
										<p className="text-sm text-muted-foreground">
											{orderItem.item.description}
										</p>
										<div className="flex items-center justify-center sm:justify-start gap-2">
											<span className="text-sm">Qty: {orderItem.quantity}</span>
											<span className="text-sm text-muted-foreground">×</span>
											<span className="text-sm">
												${Decimal(orderItem.item.price).toFixed(2)}
											</span>
										</div>
									</div>
									<div className="flex items-center justify-center sm:justify-end sm:w-24 mt-2 sm:mt-0">
										<span className="font-medium">
											$
											{Decimal(orderItem.item.price)
												.times(orderItem.quantity)
												.toFixed(2)}
										</span>
									</div>
								</div>
							))}
						</div>
						<Separator className="my-4" />
						<div className="flex justify-between">
							<span className="font-medium">Total</span>
							<span className="font-bold">${orderTotal}</span>
						</div>
					</CardContent>
				</Card>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack} disabled={isSubmitting}>
						Back
					</Button>
					<Button type="submit" onClick={onSubmit} disabled={isSubmitting}>
						{isSubmitting ? "Placing Order..." : "Place Order"}
					</Button>
				</div>
			</div>
		</div>
	);
}
