// @STEVEN CHECK THIS FUNCTION

"use client";

import { OrderTable2 } from "./OrderTable";
import { getColumns } from "./TableColumns";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";

type Order = z.infer<typeof CompleteOrderSchema>;

interface OrdersClientWrapperProps {
  orders: Order[];
  token: string;
  fundraiserName: string;
}

export function OrdersTableWrapper({
  orders,
  token,
  fundraiserName,
}: OrdersClientWrapperProps) {
  const tableColumns = getColumns(token);

  return (
    <OrderTable2
      columns={tableColumns}
      data={orders}
      fundraiserName={fundraiserName}
    />
  );
}
