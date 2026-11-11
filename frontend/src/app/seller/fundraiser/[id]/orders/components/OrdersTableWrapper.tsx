// @STEVEN CHECK THIS FUNCTION

"use client";

import { OrdersTable } from "./OrdersTable";
import { getColumns, PickupChangeHandler } from "./TableColumns";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";

type Order = z.infer<typeof CompleteOrderSchema>;

interface OrdersClientWrapperProps {
	orders: Order[];
	token: string;
	fundraiserName: string;
	onPickupChange: PickupChangeHandler;
}

export function OrdersTableWrapper({
	orders,
	token,
	fundraiserName,
	onPickupChange,
}: OrdersClientWrapperProps) {
	const tableColumns = getColumns(token, onPickupChange);

	return (
		<OrdersTable
			columns={tableColumns}
			data={orders}
			fundraiserName={fundraiserName}
		/>
	);
}
