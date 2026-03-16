import type { ItemWithAvailability } from "common";

export type RequestedItem = {
  itemId: string;
  itemName: string;
  quantity: number;
};

export type CapacityIssue = {
  itemId: string;
  itemName: string;
  requested: number;
  available: number;
  reason: "ITEM_UNAVAILABLE" | "CAPACITY_EXCEEDED";
};

type RequestedItemTotals = {
  itemId: string;
  itemName: string;
  quantity: number;
};

const aggregateRequestedItems = (
  requestedItems: RequestedItem[],
): RequestedItemTotals[] => {
  const totalsByItem = new Map<string, RequestedItemTotals>();

  requestedItems.forEach((requestedItem) => {
    const existing = totalsByItem.get(requestedItem.itemId);
    if (existing) {
      existing.quantity += requestedItem.quantity;
      return;
    }

    totalsByItem.set(requestedItem.itemId, {
      itemId: requestedItem.itemId,
      itemName: requestedItem.itemName,
      quantity: requestedItem.quantity,
    });
  });

  return Array.from(totalsByItem.values());
};

export const getCapacityIssues = (
  requestedItems: RequestedItem[],
  availabilityItems: ItemWithAvailability[],
): CapacityIssue[] => {
  const availabilityById = new Map(
    availabilityItems.map((item) => [item.id, item]),
  );
  const requestedTotals = aggregateRequestedItems(requestedItems);

  return requestedTotals.flatMap((requestedItem) => {
    const availabilityItem = availabilityById.get(requestedItem.itemId);
    if (!availabilityItem || availabilityItem.offsale) {
      return {
        itemId: requestedItem.itemId,
        itemName: requestedItem.itemName,
        requested: requestedItem.quantity,
        available: 0,
        reason: "ITEM_UNAVAILABLE" as const,
      };
    }

    if (
      availabilityItem.available !== null &&
      requestedItem.quantity > availabilityItem.available
    ) {
      return {
        itemId: requestedItem.itemId,
        itemName: requestedItem.itemName,
        requested: requestedItem.quantity,
        available: availabilityItem.available,
        reason: "CAPACITY_EXCEEDED" as const,
      };
    }

    return [];
  });
};

export const formatCapacityIssueMessage = (issue: CapacityIssue): string => {
  if (issue.reason === "ITEM_UNAVAILABLE") {
    return `${issue.itemName} is no longer available for purchase.`;
  }

  if (issue.available <= 0) {
    return `${issue.itemName} is sold out.`;
  }

  return `${issue.itemName}: only ${issue.available} available, but your order needs ${issue.requested}.`;
};
