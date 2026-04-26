import {
  sendOrderConfirmation,
  sendPaymentReminderEmail,
  sendAnnouncementEmail,
  sendOrganizationInviteEmail,
  sendPendingAdminInviteEmail,
  sendVenmoSetupEmail,
} from "../utils/email";

const to = process.argv[2];
const type = process.argv[3]; // optional: filter to a specific email type

if (!to) {
  console.error(
    "Usage: pnpm test:email <email-address> [type]\n\nTypes: order, reminder, announcement, invite, pending-invite, venmo\nOmit type to send all.",
  );
  process.exit(1);
}

const mockUser = {
  id: "test-user",
  name: "Test User",
  email: to,
  supabaseId: "test",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrganization = {
  id: "test-org",
  name: "Cornell Baking Club",
  description:
    "A student-run club dedicated to baking and fundraising for campus events.",
  websiteUrl: "https://cornellbaking.org",
  imageUrl: null,
  isAuthorized: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  admins: [mockUser],
  pendingAdmins: [],
  fundraisers: [],
};

const mockFundraiser = {
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
      endsAt: new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
      ),
      fundraiserId: "test-fundraiser",
    },
  ],
  organization: mockOrganization,
  items: [],
  announcements: [],
  referralSettings: null,
};

const mockOrder = {
  id: "test-order-123",
  createdAt: new Date(),
  paymentStatus: "PENDING" as const,
  paymentMethod: "VENMO" as const,
  buyer: mockUser,
  fundraiser: mockFundraiser,
  orderItems: [],
  totalAmount: 25.0,
  pickupEventId: "test-event",
  referralCode: null,
};

const allTests: Record<string, { name: string; send: () => Promise<any> }> = {
  order: {
    name: "Order Confirmation",
    send: () => sendOrderConfirmation(mockOrder as any),
  },
  reminder: {
    name: "Payment Reminder",
    send: () => sendPaymentReminderEmail(mockOrder as any),
  },
  announcement: {
    name: "Announcement",
    send: () =>
      sendAnnouncementEmail({
        fundraiser: mockFundraiser as any,
        announcement: {
          id: "test-announcement",
          message:
            "Hey everyone! Just a reminder that our bake sale is coming up this weekend. We have cookies, brownies, and cupcakes available. Don't miss out!",
          createdAt: new Date(),
        },
        recipients: [mockUser],
      }),
  },
  invite: {
    name: "Organization Invite (existing user)",
    send: () =>
      sendOrganizationInviteEmail({
        organization: mockOrganization as any,
        creator: { ...mockUser, name: "Jane Smith" },
        invitedAdmins: [mockUser],
      }),
  },
  "pending-invite": {
    name: "Pending Admin Invite (new user)",
    send: () =>
      sendPendingAdminInviteEmail({
        organization: mockOrganization as any,
        creator: { ...mockUser, name: "Jane Smith" },
        pendingAdminEmails: [to],
      }),
  },
  venmo: {
    name: "Venmo Setup",
    send: () =>
      sendVenmoSetupEmail({
        venmoEmail: to,
        fundraiserName: "Spring Bake Sale 2026",
      }),
  },
};

async function main() {
  if (type && !allTests[type]) {
    console.error(
      `Unknown type "${type}". Valid types: ${Object.keys(allTests).join(", ")}`,
    );
    process.exit(1);
  }

  const testsToRun = type
    ? { [type]: allTests[type] }
    : allTests;

  const count = Object.keys(testsToRun).length;
  console.log(`Sending ${count} test email(s) to ${to}...\n`);

  for (const [, test] of Object.entries(testsToRun)) {
    try {
      await test.send();
      console.log(`  [OK] ${test.name}`);
    } catch (error) {
      console.error(`  [FAIL] ${test.name}:`, error);
    }
  }

  console.log("\nDone! Check your inbox.");
}

main();
