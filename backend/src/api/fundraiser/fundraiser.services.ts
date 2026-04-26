import { Prisma } from "../../generated/client";
import { prisma } from "../../utils/prisma";
import { Item } from "../../generated/client";
import {
  CreateFundraiserBody,
  UpdateFundraiserBody,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
  CreatePickupEventBody,
  UpdatePickupEventBody,
  CreateAnnouncementBody,
} from "common";
import { z } from "zod";
import memclient from "../../utils/memjs";

export const getFundraiser = async (fundraiserId: string) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: {
      id: fundraiserId,
    },
    include: {
      organization: {
        include: {
          admins: {
            select: {
              id: true,
            },
          },
        },
      },
      pickupEvents: {
        orderBy: {
          startsAt: "asc",
        },
      },
      announcements: {
        orderBy: {
          createdAt: "desc",
        },
      },
      referrals: {
        include: {
          referrer: true,
        },
      },
    },
  });

  return fundraiser;
};

export const getFundraiserItems = async (fundraiserId: string) => {
  const items = await prisma.item.findMany({
    where: {
      fundraiserId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return items;
};

export const getFundraiserOrders = async (fundraiserId: string) => {
  const orders = await prisma.order.findMany({
    where: {
      fundraiserId,
    },
    include: {
      buyer: true,
      fundraiser: {
        select: {
          id: true,
          name: true,
          description: true,
          published: true,
          goalAmount: true,
          imageUrls: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              authorized: true,
              logoUrl: true,
            },
          },
          pickupEvents: {
            orderBy: {
              startsAt: "asc",
            },
          },
        },
      },
      items: {
        select: { quantity: true, item: true },
      },
      referral: {
        include: {
          referrer: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};

export const getAllFundraisers = async () => {
  const fundraisers = await prisma.fundraiser.findMany({
    include: {
      organization: true,
      pickupEvents: {
        orderBy: {
          startsAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    where: {
      published: true,
    },
  });

  return fundraisers;
};

export const createFundraiser = async (
  fundraiserBody: z.infer<typeof CreateFundraiserBody>,
) => {
  const fundraiser = await prisma.fundraiser.create({
    data: {
      name: fundraiserBody.name,
      description: fundraiserBody.description,
      venmoUsername: fundraiserBody.venmoUsername,
      venmoEmail: fundraiserBody.venmoEmail,
      venmoLastFourDigits: fundraiserBody.venmoLastFourDigits,
      goalAmount: fundraiserBody.goalAmount,
      imageUrls: fundraiserBody.imageUrls,
      buyingStartsAt: fundraiserBody.buyingStartsAt,
      buyingEndsAt: fundraiserBody.buyingEndsAt,
      organization: {
        connect: {
          id: fundraiserBody.organizationId,
        },
      },
      pickupEvents: {
        create: fundraiserBody.pickupEvents,
      },
    },
    include: {
      organization: true,
      pickupEvents: true,
    },
  });

  return fundraiser;
};

export const publishFundraiser = async (fundraiserId: string) => {
  const fundraiser = await prisma.fundraiser.update({
    where: {
      id: fundraiserId,
    },
    data: {
      published: true,
    },
    include: {
      organization: true,
      pickupEvents: {
        orderBy: {
          startsAt: "asc",
        },
      },
    },
  });

  return fundraiser;
};

export const updateFundraiser = async (
  fundraiserBody: z.infer<typeof UpdateFundraiserBody> & {
    fundraiserId: string;
  },
) => {
  const fundraiser = await prisma.fundraiser.update({
    where: {
      id: fundraiserBody.fundraiserId,
    },
    data: {
      name: fundraiserBody.name,
      description: fundraiserBody.description,
      venmoUsername: fundraiserBody.venmoUsername ?? null,
      venmoEmail: fundraiserBody.venmoEmail ?? null,
      venmoLastFourDigits: fundraiserBody.venmoLastFourDigits ?? null,
      goalAmount: fundraiserBody.goalAmount ?? null,
      imageUrls: fundraiserBody.imageUrls,
      buyingStartsAt: fundraiserBody.buyingStartsAt,
      buyingEndsAt: fundraiserBody.buyingEndsAt,
    },
    include: {
      organization: true,
      pickupEvents: {
        orderBy: {
          startsAt: "asc",
        },
      },
    },
  });

  return fundraiser;
};

export const createPickupEvent = async (
  pickupEventBody: z.infer<typeof CreatePickupEventBody> & {
    fundraiserId: string;
  },
) => {
  const pickupEvent = await prisma.pickupEvent.create({
    data: {
      location: pickupEventBody.location,
      startsAt: pickupEventBody.startsAt,
      endsAt: pickupEventBody.endsAt,
      fundraiser: {
        connect: {
          id: pickupEventBody.fundraiserId,
        },
      },
    },
  });

  return pickupEvent;
};

export const updatePickupEvent = async (
  pickupEventBody: z.infer<typeof UpdatePickupEventBody> & {
    pickupEventId: string;
  },
) => {
  const pickupEvent = await prisma.pickupEvent.update({
    where: {
      id: pickupEventBody.pickupEventId,
    },
    data: {
      location: pickupEventBody.location,
      startsAt: pickupEventBody.startsAt,
      endsAt: pickupEventBody.endsAt,
    },
  });

  return pickupEvent;
};

export const deletePickupEvent = async (pickupEventId: string) => {
  const pickupEvent = await prisma.pickupEvent.delete({
    where: {
      id: pickupEventId,
    },
  });

  return pickupEvent;
};

export const createFundraiserItem = async (
  itemBody: z.infer<typeof CreateFundraiserItemBody> & { fundraiserId: string },
) => {
  const item = await prisma.item.create({
    data: {
      name: itemBody.name,
      description: itemBody.description,
      price: itemBody.price,
      profit: itemBody.profit,
      imageUrl: itemBody.imageUrl,
      limit: itemBody.limit,
      fundraiser: {
        connect: {
          id: itemBody.fundraiserId,
        },
      },
    },
  });

  return item;
};

export const getFundraiserItemForFundraiser = async (
  fundraiserId: string,
  itemId: string,
) => {
  const item = await prisma.item.findFirst({
    where: {
      id: itemId,
      fundraiserId,
    },
  });

  return item;
};

export const updateFundraiserItem = async (
  itemBody: z.infer<typeof UpdateFundraiserItemBody> & { itemId: string },
) => {
  if (itemBody.limit !== undefined) {
    const validation = await validateCapUpdate(
      itemBody.itemId,
      itemBody.limit ?? null,
    );
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
  }

  const item = await prisma.item.update({
    where: {
      id: itemBody.itemId,
    },
    data: {
      name: itemBody.name,
      description: itemBody.description,
      price: itemBody.price,
      profit: itemBody.profit ?? null,
      imageUrl: itemBody.imageUrl ?? null,
      offsale: itemBody.offsale,
      limit: itemBody.limit ?? null,
    },
  });

  return item;
};

export const deleteFundraiserItem = async (itemId: string) => {
  const item = await prisma.item.delete({
    where: {
      id: itemId,
    },
  });

  return item;
};

export const validatePublishedFundraiserItemUpdate = (
  existingItem: Item,
  updates: z.infer<typeof UpdateFundraiserItemBody>,
): { valid: boolean; reason?: string } => {
  if (!existingItem.price.equals(updates.price)) {
    return {
      valid: false,
      reason: "Cannot change price of an item in a published fundraiser",
    };
  }

  if (updates.limit === undefined) {
    return { valid: true };
  }

  if (existingItem.limit === null && updates.limit !== null) {
    return {
      valid: false,
      reason: "Cannot add an inventory cap to a published item",
    };
  }

  if (existingItem.limit !== null && updates.limit === null) {
    return {
      valid: false,
      reason: "Cannot remove an inventory cap from a published item",
    };
  }

  if (
    existingItem.limit !== null &&
    updates.limit !== null &&
    updates.limit < existingItem.limit
  ) {
    return {
      valid: false,
      reason: `Cannot decrease inventory cap. Current cap is ${existingItem.limit}`,
    };
  }

  return { valid: true };
};

export const createAnnouncement = async (
  announcementBody: z.infer<typeof CreateAnnouncementBody> & {
    fundraiserId: string;
  },
) => {
  const announcement = await prisma.announcement.create({
    data: {
      message: announcementBody.message,
      fundraiser: {
        connect: {
          id: announcementBody.fundraiserId,
        },
      },
    },
  });

  return announcement;
};

export const deleteAnnouncement = async (announcementId: string) => {
  const announcement = await prisma.announcement.delete({
    where: {
      id: announcementId,
    },
  });

  return announcement;
};

export const createReferral = async (referralBody: {
  fundraiserId: string;
  referrerId: string;
}) => {
  try {
    const referral = await prisma.referral.create({
      data: {
        fundraiser: { connect: { id: referralBody.fundraiserId } },
        referrer: { connect: { id: referralBody.referrerId } },
      },
      include: {
        referrer: true,
      },
    });

    return referral;
  } catch (error) {
    // Handle unique constraint violation
    if ((error as any).code === "P2002") {
      return null; // Duplicate referral request
    }
    throw error;
  }
};

export const getReferral = async (referralId: string) => {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      referrer: true,
      fundraiser: {
        select: {
          organization: {
            select: {
              admins: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  return referral;
};

export const approveReferral = async (referralId: string) => {
  const referral = await prisma.referral.update({
    where: { id: referralId },
    data: {
      approved: true,
    },
    include: {
      referrer: true,
    },
  });

  return referral;
};

export const deleteReferral = async (referralId: string) => {
  const referral = await prisma.referral.delete({
    where: { id: referralId },
  });

  return referral;
};

export const getFundraiserItemsWithAvailability = async (
  fundraiserId: string,
) => {
  const items = await getFundraiserItems(fundraiserId);
  const itemIds = items.map((i) => i.id);
  const confirmedCounts = await getItemsConfirmedCounts(itemIds);

  return items.map((item) => ({
    ...item,
    confirmedCount: confirmedCounts.get(item.id) ?? 0,
    available:
      item.limit !== null
        ? item.limit - (confirmedCounts.get(item.id) ?? 0)
        : null,
  }));
};

/**
 * Get confirmed quantity sold for a specific item
 * Counts orders that are CONFIRMED or have been picked up
 */
export const getItemConfirmedCount = async (
  itemId: string,
): Promise<number> => {
  const result = await prisma.orderItems.aggregate({
    where: {
      itemId,
      order: {
        OR: [{ paymentStatus: "CONFIRMED" }, { pickedUp: true }],
      },
    },
    _sum: {
      quantity: true,
    },
  });

  return result._sum.quantity ?? 0;
};

/**
 * Get confirmed counts for multiple items (bulk operation)
 */
export const getItemsConfirmedCounts = async (
  itemIds: string[],
): Promise<Map<string, number>> => {
  if (itemIds.length === 0) {
    return new Map();
  }

  const results = await prisma.orderItems.groupBy({
    by: ["itemId"],
    where: {
      itemId: { in: itemIds },
      order: {
        OR: [{ paymentStatus: "CONFIRMED" }, { pickedUp: true }],
      },
    },
    _sum: {
      quantity: true,
    },
  });

  const countsMap = new Map<string, number>();
  itemIds.forEach((id) => countsMap.set(id, 0));
  results.forEach((result) => {
    countsMap.set(result.itemId, result._sum.quantity ?? 0);
  });

  return countsMap;
};

/**
 * Validate that a proposed cap is not below confirmed orders.
 * Published fundraiser cap transition rules are enforced separately.
 */
export const validateCapUpdate = async (
  itemId: string,
  newLimit: number | null,
): Promise<{ valid: boolean; reason?: string; confirmedCount?: number }> => {
  if (newLimit === null) {
    return { valid: true };
  }

  const confirmedCount = await getItemConfirmedCount(itemId);
  if (newLimit < confirmedCount) {
    return {
      valid: false,
      reason: `Limit cannot be set below confirmed count. Already sold: ${confirmedCount}`,
      confirmedCount,
    };
  }

  return { valid: true };
};

export interface FundraiserAnalytics {
  total_revenue: number;
  total_orders: number;
  orders_picked_up: number;
  items: Record<string, number>; // units sold for each item
  pending_orders: number;
  profit: number;
  goal_amount: number;
  sale_data: Record<string, number>; // orders sold on a particular day
  revenue_data: Record<string, number>; // revenue earned on a particular day
  start_date: Date;
  end_date: Date;
}

/**
 * Calculates fundraiser analytics from orders and caches the result
 * @param fundraiserId - The ID of the fundraiser to calculate analytics for
 * @returns Promise<FundraiserAnalytics> - Analytics data including revenue, orders, and item statistics
 */
export const calculateAndCacheFundraiserAnalytics = async (
  fundraiserId: string,
) => {
  const [orders, fundraiser] = await Promise.all([
    getFundraiserOrders(fundraiserId),
    getFundraiser(fundraiserId),
  ]);

  const analytics: FundraiserAnalytics = {
    total_revenue: 0,
    total_orders: orders.length,
    orders_picked_up: 0,
    items: {},
    pending_orders: 0,
    profit: 0,
    goal_amount: Number(fundraiser?.goalAmount) ?? 0,
    sale_data: {},
    revenue_data: {},
    // Create invalid Date object if these attributes don't persist
    start_date: fundraiser?.buyingStartsAt ?? new Date(NaN),
    end_date: fundraiser?.buyingEndsAt ?? new Date(NaN),
  };

  orders.forEach((order) => {
    let orderTotal = 0;
    let orderProfit = 0;
    const isPaidOrPickedUp =
      order.pickedUp || order.paymentStatus === "CONFIRMED";

    if (order.pickedUp) {
      analytics.orders_picked_up++;
    }

    if (isPaidOrPickedUp) {
      order.items.forEach((orderItem) => {
        const itemTotal = orderItem.quantity * Number(orderItem.item.price);
        orderTotal += itemTotal;
        const itemProfit =
          orderItem.quantity * Number(orderItem.item.profit ?? 0);
        orderProfit += itemProfit;
        analytics.items[orderItem.item.name] =
          (analytics.items[orderItem.item.name] || 0) + orderItem.quantity;
      });

      // The total revenue should only consider the orders that are picked up or paid·
      analytics.total_revenue += orderTotal;

      analytics.profit += orderProfit;

      // Track revenue by date only for paid or picked up orders
      const orderDate = order.createdAt.toISOString().split("T")[0];
      analytics.revenue_data[orderDate] =
        (analytics.revenue_data[orderDate] || 0) + orderTotal;
    } else {
      analytics.pending_orders++;
    }

    // Track sales by date for all orders
    const orderDate = order.createdAt.toISOString().split("T")[0]; // Only keep the YYYY-MM-DD portion
    analytics.sale_data[orderDate] = (analytics.sale_data[orderDate] || 0) + 1;
  });

  const cacheKey = `fundraiser_analytics_${fundraiserId}`;
  try {
    await memclient.set(cacheKey, JSON.stringify(analytics), { expires: 300 }); // Cache expires after 5 minutes
  } catch (error) {
    console.error("Failed to cache analytics:", error);
  }
  return analytics;
};

/**
 * Retrieves fundraiser analytics from cache or calculates if not cached
 * @param fundraiserId - The ID of the fundraiser to get analytics for
 * @returns Promise<FundraiserAnalytics> - Analytics data from cache or freshly calculated
 */
export const getFundraiserAnalytics = async (fundraiserId: string) => {
  // Fundraiser specific id to access the cache
  const cacheKey = `fundraiser_analytics_${fundraiserId}`;

  try {
    const cached = await memclient.get(cacheKey);
    if (cached.value) {
      console.log("Found in cache");
      return JSON.parse(cached.value.toString());
    }
  } catch (error) {
    console.error("Failed to get cached analytics:", error);
  }
  console.log("Cache miss - calculating fresh analytics");
  return await calculateAndCacheFundraiserAnalytics(fundraiserId);
};

/**
 * Invalidates the cached analytics for a specific fundraiser
 * @param fundraiserId - The ID of the fundraiser whose cache should be invalidated
 * @returns Promise<void>
 */
// This is tentative for now, need to decide when the cache will be invalidated for the fundraiser
export const invalidateFundraiserAnalyticsCache = async (
  fundraiserId: string,
) => {
  const cacheKey = `fundraiser_analytics_${fundraiserId}`;
  try {
    console.log("Invalidating cache for key:", cacheKey);
    const result = await memclient.delete(cacheKey);
    console.log("Cache invalidation result:", result);
  } catch (error) {
    console.error("Failed to invalidate analytics cache:", error);
  }
};

/**
 * Peek operation to check if cached analytics exist without computing new ones
 * @param cacheKey - The cache key to check
 * @returns Promise<FundraiserAnalytics | null> - Analytics data if cache exists, null otherwise
 */
const peekCachedAnalytics = async (
  cacheKey: string,
): Promise<FundraiserAnalytics | null> => {
  try {
    const cached = await memclient.get(cacheKey);

    // Return null if cache doesn't exist - do NOT recalculate
    if (!cached.value) {
      return null;
    }

    return JSON.parse(cached.value.toString());
  } catch (error) {
    console.error("Failed to peek cached analytics:", error);
    return null;
  }
};

/**
 * Updates cached analytics when a new order is created
 * Increments total orders, pending orders, and updates sale/revenue data by date
 * Only updates if cache already exists - does not create new cache
 * @param fundraiserId - The ID of the fundraiser
 * @param orderDate - The date the order was created
 * @returns Promise<void>
 */
export const updateCacheForNewOrder = async (
  fundraiserId: string,
  orderDate: Date,
) => {
  const cacheKey = `fundraiser_analytics_${fundraiserId}`;
  try {
    // Peek at cache - only update if it exists
    const analytics = await peekCachedAnalytics(cacheKey);
    if (!analytics) {
      console.log("No cache found for new order - skipping update");
      return;
    }

    // Increment counters
    analytics.total_orders++;
    analytics.pending_orders++;

    // Update sales data by date
    const dateKey = orderDate.toISOString().split("T")[0];

    // Update sale data by date
    analytics.sale_data[dateKey] = (analytics.sale_data[dateKey] || 0) + 1;

    // Save updated analytics back to cache
    await memclient.set(cacheKey, JSON.stringify(analytics), { expires: 300 });
    console.log("Cached value updated for new added order");
  } catch (error) {
    console.error("Failed to update cache for new order:", error);
  }
};

/**
 * Updates cached analytics when an order is marked as picked up
 * Increments picked up count, decrements pending, adds revenue, items, and profit
 * Only updates if cache already exists - does not create new cache
 * @param fundraiserId - The ID of the fundraiser
 * @param order - The order object with items included
 * @returns Promise<void>
 */
export const updateCacheForOrderPickup = async (
  fundraiserId: string,
  order: {
    createdAt: Date;
    items: Array<{
      quantity: number;
      item: {
        name: string;
        price: Prisma.Decimal;
        profit: Prisma.Decimal | null;
      };
    }>;
  },
  paymentStatus: string,
) => {
  const cacheKey = `fundraiser_analytics_${fundraiserId}`;
  try {
    // Peek at cache - only update if it exists
    const analytics = await peekCachedAnalytics(cacheKey);
    if (!analytics) {
      console.log("No cache found for order pickup - skipping update");
      return;
    }

    // Calculate order total and update items
    let orderTotal = 0;
    let orderProfit = 0;
    order.items.forEach((orderItem) => {
      const itemTotal = orderItem.quantity * Number(orderItem.item.price);
      orderTotal += itemTotal;
      const itemProfit =
        orderItem.quantity * Number(orderItem.item.profit ?? 0);
      orderProfit += itemProfit;
      analytics.items[orderItem.item.name] =
        (analytics.items[orderItem.item.name] || 0) + orderItem.quantity;
    });

    // Update counters
    analytics.orders_picked_up++;

    // Only update revenue and pending count if order was not already CONFIRMED
    // CONFIRMED orders already had their revenue counted when payment was confirmed
    if (paymentStatus !== "CONFIRMED") {
      analytics.pending_orders--;
      analytics.total_revenue += orderTotal;
      analytics.profit += orderProfit;

      // Update revenue data by date
      const dateKey = order.createdAt.toISOString().split("T")[0];
      analytics.revenue_data[dateKey] =
        (analytics.revenue_data[dateKey] || 0) + orderTotal;
    }

    // Save updated analytics back to cache
    await memclient.set(cacheKey, JSON.stringify(analytics), { expires: 300 });
    console.log("Cached value updated for pickedup order");
  } catch (error) {
    console.error("Failed to update cache for order pickup:", error);
  }
};

/**
 * Updates cached analytics when an order payment is confirmed
 * Decrements pending orders, adds revenue, items, and profit
 * Only updates if cache already exists - does not create new cache
 * @param fundraiserId - The ID of the fundraiser
 * @param order - The order object with items included
 * @returns Promise<void>
 */
export const updateCacheForOrderConfirmation = async (
  fundraiserId: string,
  order: {
    pickedUp: boolean;
    createdAt: Date;
    items: Array<{
      quantity: number;
      item: {
        name: string;
        price: Prisma.Decimal;
        profit: Prisma.Decimal | null;
      };
    }>;
  },
) => {
  const cacheKey = `fundraiser_analytics_${fundraiserId}`;
  try {
    // Peek at cache - only update if it exists
    const analytics = await peekCachedAnalytics(cacheKey);
    if (!analytics) {
      console.log("No cache found for order confirmation - skipping update");
      return;
    }

    // If order was already picked up, items/revenue were already counted
    // Only decrement pending_orders in that case
    if (order.pickedUp) {
      analytics.pending_orders--;
      await memclient.set(cacheKey, JSON.stringify(analytics), {
        expires: 300,
      });
      console.log(
        "Cached value updated for confirmed order (already picked up)",
      );
      return;
    }

    // Calculate order total and update items
    let orderTotal = 0;
    let orderProfit = 0;
    order.items.forEach((orderItem) => {
      const itemTotal = orderItem.quantity * Number(orderItem.item.price);
      orderTotal += itemTotal;
      const itemProfit =
        orderItem.quantity * Number(orderItem.item.profit ?? 0);
      orderProfit += itemProfit;
      analytics.items[orderItem.item.name] =
        (analytics.items[orderItem.item.name] || 0) + orderItem.quantity;
    });

    // Update counters and revenue
    analytics.pending_orders--;
    analytics.total_revenue += orderTotal;
    analytics.profit += orderProfit;

    // Update revenue data by date
    const dateKey = order.createdAt.toISOString().split("T")[0];
    analytics.revenue_data[dateKey] =
      (analytics.revenue_data[dateKey] || 0) + orderTotal;

    // Save updated analytics back to cache
    await memclient.set(cacheKey, JSON.stringify(analytics), { expires: 300 });
    console.log("Cached value updated for confirmed order");
  } catch (error) {
    console.error("Failed to update cache for order confirmation:", error);
  }
};
