import "server-only";
import { CompleteFundraiserSchema, ItemWithAvailabilitySchema } from "common";
import { z } from "zod";

export const LOCAL_MOCK_FUNDRAISER_ID = "00000000-0000-4000-8000-000000000001";

// Temporary frontend fixture; never persisted. Only server routes select it.
export function getLocalMockFundraiser(host: string) {
  const hostname = host.toLowerCase().replace(/:\d+$/, "");
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.LOCAL_MOCK_FUNDRAISER === "false" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(hostname)
  ) return null;

  // Next Image serves this local public asset directly; real API images remain URLs.
  return CompleteFundraiserSchema.extend({
    imageUrls: z.array(z.literal("/images/wushu-bake-sale.png")),
  }).parse({
    id: LOCAL_MOCK_FUNDRAISER_ID,
    name: "Wushu Sweet Treats (temporary placeholder)",
    description: "Come satisfy your sweet tooth with Wushu! We'll be selling tanghulu, cinnamon sugar doughnut muffins, and tiramisu. Stop by to grab a sweet treat and support Cornell Wushu!",
    published: true,
    organization: {
      id: "00000000-0000-4000-8000-000000000002",
      name: "Cornell Wushu",
      description: "Local UI testing fixture for Cornell Wushu.",
      authorized: true,
      logoUrl: null,
    },
    imageUrls: ["/images/wushu-bake-sale.png"],
    buyingStartsAt: new Date("2026-11-09T09:00:00-05:00"),
    buyingEndsAt: new Date("2026-11-16T18:00:00-05:00"),
    pickupEvents: [{
      id: "00000000-0000-4000-8000-000000000003",
      startsAt: new Date("2026-11-16T12:00:00-05:00"),
      endsAt: new Date("2026-11-16T18:00:00-05:00"),
      location: "Statler Lobby",
    }],
    announcements: [],
    referrals: [],
  });
}

export function getLocalMockItems() {
  return ItemWithAvailabilitySchema.array().parse([
    { name: "Tanghulu", description: "Candied fruit treat.", price: 1 },
    { name: "Cinnamon Sugar Doughnut Muffins", description: "Muffins coated in cinnamon sugar.", price: 2 },
    { name: "Tiramisu", description: "Coffee-flavored layered dessert.", price: 3 },
  ].map((item, index) => ({
    ...item,
    id: `00000000-0000-4000-8000-00000000001${index}`,
    name: `${item.name} [TEST PRICE]`,
    description: `${item.description} Placeholder price for local UI testing only; not an actual product listing.`,
    category: "DESSERTS",
    imageUrl: null,
    offsale: false,
    limit: null,
    available: null,
    confirmedCount: 0,
  })));
}
