// @STEVEN CHECK THIS FUNCTION

"use client";

import { useMemo } from "react";
import { OrdersTable } from "./OrdersTable";
import { useOrders } from "./OrdersProvider";
import { getColumns } from "./TableColumns";

interface OrdersClientWrapperProps {
	token: string;
	fundraiserName: string;
}

export function OrdersTableWrapper({
	token,
	fundraiserName,
}: OrdersClientWrapperProps) {
	const { orders, setOrderPickedUp, setOrderPaymentConfirmed } = useOrders();

	// Stable columns keep the table from rebuilding and re-sorting every order
	// on each render.
	const tableColumns = useMemo(
		() => getColumns(token, setOrderPickedUp, setOrderPaymentConfirmed),
		[token, setOrderPickedUp, setOrderPaymentConfirmed],
	);

	return (
		<OrdersTable
			columns={tableColumns}
			data={orders}
			fundraiserName={fundraiserName}
		/>
	);
}
