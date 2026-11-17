// @STEVEN CHECK THIS FUNCTION

"use client";

import { useMemo } from "react";
import { OrdersTable } from "./OrdersTable";
import {
	getColumns,
	PaymentConfirmedHandler,
	PickupChangeHandler,
} from "./TableColumns";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";

type Order = z.infer<typeof CompleteOrderSchema>;

interface OrdersClientWrapperProps {
	orders: Order[];
	token: string;
	fundraiserName: string;
	onPickupChange: PickupChangeHandler;
	onPaymentConfirmed: PaymentConfirmedHandler;
}

export function OrdersTableWrapper({
	orders,
	token,
	fundraiserName,
	onPickupChange,
	onPaymentConfirmed,
}: OrdersClientWrapperProps) {
	// Stable columns keep the table from rebuilding and re-sorting every order
	// on each render.
	const tableColumns = useMemo(
		() => getColumns(token, onPickupChange, onPaymentConfirmed),
		[token, onPickupChange, onPaymentConfirmed],
	);

	return (
		<OrdersTable
			columns={tableColumns}
			data={orders}
			fundraiserName={fundraiserName}
		/>
	);
}
