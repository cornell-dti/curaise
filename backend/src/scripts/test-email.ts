import { sendEmail } from "../utils/email";

const to = process.argv[2];
if (!to) {
  console.error("Usage: pnpm test:email <email-address>");
  process.exit(1);
}

// Import wrapInTemplate by re-exporting it, or just inline a test.
// Since wrapInTemplate is not exported, we'll call sendEmail with sample HTML
// that mimics what a real email would produce. Instead, let's just call one of
// the real email functions with mock data.

import { sendOrderConfirmation } from "../utils/email";

const mockOrder = {
  id: "test-order-123",
  createdAt: new Date(),
  paymentStatus: "PENDING" as const,
  paymentMethod: "VENMO" as const,
  buyer: {
    id: "test-user",
    name: "Test User",
    email: to,
    supabaseId: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  fundraiser: {
    id: "test-fundraiser",
    name: "Spring Bake Sale 2026",
    description: "A delicious fundraiser for a great cause!",
    goalAmount: 500,
    currentAmount: 150,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    imageUrl: null,
    venmoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId: "test-org",
    pickupEvents: [
      {
        id: "test-event",
        location: "Duffield Hall, Cornell University",
        startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        fundraiserId: "test-fundraiser",
      },
    ],
    organization: {
      id: "test-org",
      name: "Cornell Baking Club",
      description: "We bake things",
      websiteUrl: null,
      imageUrl: null,
      isAuthorized: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    items: [],
    announcements: [],
    referralSettings: null,
  },
  orderItems: [],
  totalAmount: 25.0,
  pickupEventId: "test-event",
  referralCode: null,
};

async function main() {
  console.log(`Sending test email to ${to}...`);
  try {
    await sendOrderConfirmation(mockOrder as any);
    console.log("Test email sent successfully! Check your inbox.");
  } catch (error) {
    console.error("Failed to send test email:", error);
    process.exit(1);
  }
}

main();
