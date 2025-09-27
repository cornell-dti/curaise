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
	items: Record<string, number>;
}

/**
 * Calculates fundraiser analytics from orders and caches the result
 * @param fundraiserId - The ID of the fundraiser to calculate analytics for
 * @returns Promise<FundraiserAnalytics> - Analytics data including revenue, orders, and item statistics
 */
export const calculateAndCacheFundraiserAnalytics = async (
	fundraiserId: string
) => {
	const orders = await prisma.order.findMany({
		where: { fundraiserId },
		include: {
			items: {
				select: {
					quantity: true,
					item: { select: { name: true, price: true } },
				},
			},
		},
	});

	const analytics: FundraiserAnalytics = {
		total_revenue: 0,
		total_orders: orders.length,
		orders_picked_up: 0,
		items: {},
	};

	orders.forEach((order) => {
		let orderTotal = 0;

		order.items.forEach((orderItem) => {
			const itemTotal = orderItem.quantity * Number(orderItem.item.price);
			orderTotal += itemTotal;
			analytics.items[orderItem.item.name] =
				(analytics.items[orderItem.item.name] || 0) + orderItem.quantity;
		});

		analytics.total_revenue += orderTotal;

		if (order.pickedUp) {
			analytics.orders_picked_up++;
		}
	});

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
			console.log("This data is in cache");
			return JSON.parse(cached.value.toString());
		}
	} catch (error) {
		console.error("Failed to get cached analytics:", error);
	}
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
