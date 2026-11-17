// @STEVEN CHECK THIS FUNCTION

"use client";

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
	const tableColumns = getColumns(token, onPickupChange, onPaymentConfirmed);

	return (
		<OrdersTable
			columns={tableColumns}
			data={orders}
			fundraiserName={fundraiserName}
		/>
	);
}
