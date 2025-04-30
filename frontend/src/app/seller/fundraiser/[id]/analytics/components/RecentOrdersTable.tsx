import React from "react";
import { formatRelativeTime } from "../analytics-utils";
import { z } from "zod";
import { CompleteOrderSchema } from "common";

type RecentOrdersTableProps = {
  orders: z.infer<typeof CompleteOrderSchema>[];
};

export default function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">No recent orders</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Buyer
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order Date
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => {
            // Calculate order total
            const orderTotal = order.items.reduce(
              (sum, item) => sum + Number(item.item.price) * item.quantity,
              0
            );

            return (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  {order.buyer.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatRelativeTime(new Date(order.createdAt))}
                </td>
                <td className="px-4 py-2">
                  <div className="max-h-24 overflow-y-auto">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="mb-1">
                        <span className="font-medium">{item.quantity}x</span>{" "}
                        {item.item.name}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  ${orderTotal.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
