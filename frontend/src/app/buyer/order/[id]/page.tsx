import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CompleteOrderSchema, BasicFundraiserSchema } from "common";
import Decimal from "decimal.js";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	CalendarIcon,
	CreditCard,
	DollarSign,
	Mail,
	MapPin,
	User,
} from "lucide-react";
import { PaymentStatusBadge } from "@/components/custom/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/custom/CopyButton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ConfettiWrapper } from "@/components/custom/ConfettiWrapper";
import { OrderQRCodeDisplay } from "@/components/custom/OrderQRCodeDisplay";
import { serverFetch } from "@/lib/fetcher";

export default async function OrderPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

	const supabase = await createClient();
	const id = (await params).id;

	// protect page (must use supabase.auth.getUser() according to docs)
	const {
		data: { user },
		error: error1,
	} = await supabase.auth.getUser();
	if (error1 || !user) {
		redirect("/");
	}

	// get auth jwt token
	const {
		data: { session },
		error: error2,
	} = await supabase.auth.getSession();
	if (error2 || !session?.access_token) {
		throw new Error("No session found");
	}

	const order = await serverFetch(`/order/${id}`, {
		token: session.access_token,
		schema: CompleteOrderSchema,
	});
	const fundraiser = await serverFetch(`/fundraiser/${order.fundraiser.id}`, {
		token: session.access_token,
		schema: BasicFundraiserSchema,
	});

	const orderTotal = order.items
		.reduce(
			(total, item) =>
				total.plus(Decimal(item.item.price).times(item.quantity)),
			new Decimal(0),
		)
		.toFixed(2);

	// Use full order ID for Venmo payment
	const orderIdForPayment = order.id;

	// Get banner styling based on payment status and method
	const getBannerStyling = () => {
		// If payment is confirmed, show confirmed UI regardless of payment method
		if (order.paymentStatus === "CONFIRMED") {
			return {
				borderColor: "border-green-500",
				textColor: "text-green-800 dark:text-green-200",
				title: "Payment Confirmed",
				message:
					"Your payment has been verified. No further action is required.",
			};
		}

		// If unverifiable AND venmo, show unverifiable message
		if (
			order.paymentStatus === "UNVERIFIABLE" &&
			order.paymentMethod === "VENMO"
		) {
			return {
				borderColor: "border-blue-500",
				textColor: "text-blue-800 dark:text-blue-200",
				title: "Order Processed",
				message:
					"Your order has been received. Payment will have to be manually verified by the fundraiser managers.",
			};
		}

		// For OTHER payment method (PENDING or UNVERIFIABLE), show unverifiable messaging
		if (order.paymentMethod === "OTHER") {
			return {
				borderColor: "border-blue-500",
				textColor: "text-blue-800 dark:text-blue-200",
				title: "Order Processed",
				message:
					"Your order has been received. Payment will have to be manually verified by the fundraiser managers.",
			};
		}

		// Default case: VENMO + PENDING (show payment required message)
		return {
			borderColor: "border-blue-500",
			textColor: "text-blue-800 dark:text-blue-200",
			title: "Payment Required",
			message: "Complete your payment to confirm your order.",
		};
	};

	const bannerStyle = getBannerStyling();

	return (
		<div className="container px-4 md:px-[157px] py-10">
			<ConfettiWrapper />
			<div className="flex flex-col gap-2 mb-6">
				<div className="flex items-center gap-10 mb-2">
					<h1 className="text-2xl font-bold">Order Details</h1>
					<PaymentStatusBadge order={order} />
				</div>
				<div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm text-gray-800">
					<span>
						Ordered on {format(order.createdAt, "MMM d, yyyy 'at' h:mm a")}
					</span>
					<span className="hidden md:inline">|</span>
					<span>Order Id: {order.id}</span>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3 lg:auto-rows-min">
				{/* Row 1, Column 1 - Payment Banner (1/3 width) */}
				<Card
					className={`${bannerStyle.borderColor} order-1 lg:order-none lg:row-start-1 lg:col-start-1`}>
					<CardHeader className="py-6">
						<CardTitle className={bannerStyle.textColor}>
							{bannerStyle.title}
						</CardTitle>
						<CardDescription className={bannerStyle.textColor}>
							{bannerStyle.message}
						</CardDescription>
					</CardHeader>
					{/* Show CardContent for PENDING VENMO orders with venmoUsername */}
					{order.paymentStatus === "PENDING" &&
						order.paymentMethod === "VENMO" &&
						fundraiser.venmoUsername && (
							<CardContent>
								<div className="space-y-4">
									<div className="flex justify-center">
										<Button
											size="lg"
											asChild
											className="flex items-center gap-2 bg-[#008CFF] hover:bg-[#2E7BB8] text-white font-semibold px-4 py-3 text-md">
											<a
												href={`https://venmo.com/${
													fundraiser.venmoUsername
												}?txn=pay&note=${encodeURIComponent(
													orderIdForPayment,
												)}&amount=${encodeURIComponent(orderTotal)}`}
												target="_blank"
												rel="noopener noreferrer">
												<span className="flex items-center gap-2">
													<svg
														width="48"
														height="48"
														style={{ width: "2rem", height: "2rem" }}
														xmlns="http://www.w3.org/2000/svg"
														aria-label="Venmo"
														role="img"
														viewBox="0 0 512 512">
														<rect
															width="512"
															height="512"
															rx="15%"
															fill="transparent"
														/>
														<path
															d="m381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z"
															fill="#ffffff"
														/>
													</svg>
													<span>Pay with Venmo</span>
												</span>
											</a>
										</Button>
									</div>

									{/* Show payment details */}
									<details className="text-sm text-muted-foreground">
										<summary className="cursor-pointer hover:text-foreground">
											Link not working?
										</summary>
										<div className="mt-2 pl-4 border-l-2 border-muted space-y-2">
											<p className="mb-1 text-sm">
												Manual entry details (enter exactly as shown, or the
												order may not be processed correctly):
											</p>

											<p className="text-sm">Send to Venmo username:</p>
											<div className="flex items-center gap-2">
												<code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
													@{fundraiser.venmoUsername}
												</code>
												<CopyButton text={`${fundraiser.venmoUsername}`} />
											</div>

											<p className="text-sm">Amount to send:</p>
											<div className="flex items-center gap-2">
												<code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
													${orderTotal}
												</code>
												<CopyButton text={orderTotal} />
											</div>

											<p className="text-sm">
												Send this exact order ID as your Venmo message:
											</p>
											<div className="flex items-center gap-2">
												<code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
													{orderIdForPayment}
												</code>
												<CopyButton text={orderIdForPayment} />
											</div>
										</div>
									</details>
								</div>
							</CardContent>
						)}
				</Card>

				{/* Row 1, Column 2-3 - Order Summary (spans 2 columns for 2/3 width) */}
				<Card className="order-4 lg:order-none lg:row-start-1 lg:col-start-2 lg:col-span-2">
					<CardHeader>
						<CardTitle>Order Summary</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{/* Pickup Details Section */}
							<div className="space-y-3">
								<h3 className="font-semibold text-base">Pickup Details</h3>
								{order.fundraiser.pickupEvents.length > 0 && (
									<div className="flex items-center gap-2">
										<CalendarIcon className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">
											{format(
												order.fundraiser.pickupEvents[0].startsAt,
												"EEEE, M/d/yyyy",
											)}
										</span>
									</div>
								)}
								<div className="flex flex-col gap-2">
									{order.fundraiser.pickupEvents.map((event) => (
										<div key={event.id} className="flex items-start gap-2">
											<MapPin className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
											<span className="text-sm">
												<span className="font-medium">{event.location}</span>
												<br />
												{format(event.startsAt, "h:mm a")} to{" "}
												{format(event.endsAt, "h:mm a")}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Payment Details Section */}
							<div className="space-y-3">
								<h3 className="font-semibold text-base">Payment Details</h3>
								<div className="flex items-center gap-2">
									<CreditCard className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm">
										Paid with {order.paymentMethod}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<DollarSign className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-medium">
										${orderTotal} Total
									</span>
								</div>
							</div>

							{/* Buyer Info Section */}
							<div className="space-y-3">
								<h3 className="font-semibold text-base">Buyer Info</h3>
								<div className="flex items-center gap-2">
									<User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
									<span className="text-sm">{order.buyer.name}</span>
								</div>
								<div className="flex items-start gap-2">
									<Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
									<span className="text-sm break-all">{order.buyer.email}</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Row 2, Column 3 - Order Items */}
				<Card className="order-3 lg:order-none lg:row-start-2 lg:col-start-3">
					<CardHeader>
						<CardTitle>Order Items</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{/* Header */}
							<div className="grid grid-cols-[1fr_auto_auto] gap-4 text-sm font-semibold border-b pb-2">
								<div>Items</div>
								<div>Qty</div>
								<div>Cost</div>
							</div>

							{/* Items */}
							{order.items.map((orderItem) => (
								<div
									key={orderItem.item.id}
									className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
									<div className="flex items-center gap-3">
										{orderItem.item.imageUrl ? (
											<img
												src={orderItem.item.imageUrl || "/placeholder.svg"}
												alt={orderItem.item.name}
												className="w-12 h-12 rounded object-cover flex-shrink-0"
											/>
										) : (
											<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
												<span className="text-xs text-gray-400">No image</span>
											</div>
										)}
										<span className="text-sm">{orderItem.item.name}</span>
									</div>
									<div className="text-sm">x{orderItem.quantity}</div>
									<div className="text-sm">
										${Decimal(orderItem.item.price).toFixed(2)}
									</div>
								</div>
							))}

							{/* Total */}
							<Separator />
							<div className="grid grid-cols-[1fr_auto_auto] gap-4 font-bold">
								<div>Total</div>
								<div></div>
								<div>${orderTotal}</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Row 2, Column 1-2 - QR Code (spans 2 columns for 2/3 width) */}
				<Card className="order-2 lg:order-none lg:row-start-2 lg:col-start-1 lg:col-span-2">
					<CardHeader>
						<CardTitle>Venmo QR Code</CardTitle>
						<CardDescription>
							Show this to DTI at pick up to get your order.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<OrderQRCodeDisplay orderId={order.id} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
