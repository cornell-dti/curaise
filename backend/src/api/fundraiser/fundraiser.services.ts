import { prisma } from "../../utils/prisma";
import {
  CreateFundraiserBody,
  UpdateFundraiserBody,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
  CreateAnnouncementBody,
} from "common";
import { z } from "zod";
import memclient from "../../utils/memjs";

// Extract profit margin constant for the protif calculation in the analytics
// This constant can be easily mocked for profit calculation in backend test to ensure that different margin values work
export const PROFIT_MARGIN = 0.2;

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
      announcements: {
        orderBy: {
          createdAt: "desc",
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
          goalAmount: true,
          imageUrls: true,
          pickupLocation: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          pickupStartsAt: true,
          pickupEndsAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              authorized: true,
              logoUrl: true,
            },
          },
        },
      },
      items: {
        select: { quantity: true, item: true },
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return fundraisers;
};

export const createFundraiser = async (
  fundraiserBody: z.infer<typeof CreateFundraiserBody>
) => {
  const fundraiser = await prisma.fundraiser.create({
    data: {
      name: fundraiserBody.name,
      description: fundraiserBody.description,
      venmoUsername: fundraiserBody.venmoUsername,
      goalAmount: fundraiserBody.goalAmount,
      pickupLocation: fundraiserBody.pickupLocation,
      imageUrls: fundraiserBody.imageUrls,
      buyingStartsAt: fundraiserBody.buyingStartsAt,
      buyingEndsAt: fundraiserBody.buyingEndsAt,
      pickupStartsAt: fundraiserBody.pickupStartsAt,
      pickupEndsAt: fundraiserBody.pickupEndsAt,
      organization: {
        connect: {
          id: fundraiserBody.organizationId,
        },
      },
    },
    include: {
      organization: true,
    },
  });

  return fundraiser;
};

export const updateFundraiser = async (
  fundraiserBody: z.infer<typeof UpdateFundraiserBody> & {
    fundraiserId: string;
  }
) => {
  const fundraiser = await prisma.fundraiser.update({
    where: {
      id: fundraiserBody.fundraiserId,
    },
    data: {
      name: fundraiserBody.name,
      description: fundraiserBody.description,
      venmoUsername: fundraiserBody.venmoUsername ?? null,
      goalAmount: fundraiserBody.goalAmount ?? null,
      pickupLocation: fundraiserBody.pickupLocation,
      imageUrls: fundraiserBody.imageUrls,
      buyingStartsAt: fundraiserBody.buyingStartsAt,
      buyingEndsAt: fundraiserBody.buyingEndsAt,
      pickupStartsAt: fundraiserBody.pickupStartsAt,
      pickupEndsAt: fundraiserBody.pickupEndsAt,
    },
    include: {
      organization: true,
    },
  });

  return fundraiser;
};

export const createFundraiserItem = async (
  itemBody: z.infer<typeof CreateFundraiserItemBody> & { fundraiserId: string }
) => {
  const item = await prisma.item.create({
    data: {
      name: itemBody.name,
      description: itemBody.description,
      price: itemBody.price,
      imageUrl: itemBody.imageUrl,
      fundraiser: {
        connect: {
          id: itemBody.fundraiserId,
        },
      },
    },
  });

  return item;
};

export const updateFundraiserItem = async (
  itemBody: z.infer<typeof UpdateFundraiserItemBody> & { itemId: string }
) => {
  const item = await prisma.item.update({
    where: {
      id: itemBody.itemId,
    },
    data: {
      name: itemBody.name,
      description: itemBody.description,
      price: itemBody.price,
      imageUrl: itemBody.imageUrl ?? null,
      offsale: itemBody.offsale,
    },
  });

  return item;
};

export const createAnnouncement = async (
  announcementBody: z.infer<typeof CreateAnnouncementBody> & {
    fundraiserId: string;
  }
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
  fundraiserId: string
) => {
  const [orders, fundraiser] = await Promise.all([
    getFundraiserOrders(fundraiserId),
    getFundraiser(fundraiserId)
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
    end_date: fundraiser?.buyingEndsAt ?? new Date(NaN)
  };

  orders.forEach((order) => {
    let orderTotal = 0;
    const isPaidOrPickedUp = order.pickedUp || order.paymentStatus === 'CONFIRMED';

    if (order.pickedUp) {
      analytics.orders_picked_up++;
    }

    if (isPaidOrPickedUp) {
      order.items.forEach((orderItem) => {
        const itemTotal = orderItem.quantity * Number(orderItem.item.price);
        orderTotal += itemTotal;
        analytics.items[orderItem.item.name] =
          (analytics.items[orderItem.item.name] || 0) + orderItem.quantity;
      });

      // The total revenue should only consider the orders that are picked up or paid·
      analytics.total_revenue += orderTotal;

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

  analytics.profit = Math.round(analytics.total_revenue * PROFIT_MARGIN * 100) / 100;

  const cacheKey = `fundraiser_analytics_${fundraiserId}`;
  try {
    await memclient.set(cacheKey, JSON.stringify(analytics), { expires: 7200 }); // Tentative expiration of 2 hrs
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
      console.log("Found in cache")
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
  fundraiserId: string
) => {
  const cacheKey = `fundraiser_analytics_${fundraiserId}`;
  try {
    await memclient.delete(cacheKey);
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
  orderDate: Date
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
    await memclient.set(cacheKey, JSON.stringify(analytics), { expires: 7200 });
    console.log("Cached value updated for new added order")
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
        price: number | any;
      };
    }>;
  }
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
    order.items.forEach((orderItem) => {
      const itemTotal = orderItem.quantity * Number(orderItem.item.price);
      orderTotal += itemTotal;
      analytics.items[orderItem.item.name] =
        (analytics.items[orderItem.item.name] || 0) + orderItem.quantity;
    });

    // Update counters
    analytics.orders_picked_up++;
    analytics.pending_orders--;
    analytics.total_revenue += orderTotal;
    analytics.profit = Math.round(analytics.total_revenue * PROFIT_MARGIN * 100) / 100;

    // Update revenue data by date
    const dateKey = order.createdAt.toISOString().split("T")[0];
    analytics.revenue_data[dateKey] =
      (analytics.revenue_data[dateKey] || 0) + orderTotal;

    // Save updated analytics back to cache
    await memclient.set(cacheKey, JSON.stringify(analytics), { expires: 7200 });
    console.log("Cached value updated for pickedup order")
  } catch (error) {
    console.error("Failed to update cache for order pickup:", error);
  }
};
