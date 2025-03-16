import { PrismaClient, PaymentMethod, PaymentStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.orderItems.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.announcement.deleteMany({});
  await prisma.fundraiser.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      email: {
        startsWith: "test",
      },
    },
  });

  // Create users
  const user1 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: "testuser1@cornell.edu",
      name: "Test One",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: "testuser2@cornell.edu",
      name: "Test Two",
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: "testuser3@cornell.edu",
      name: "Test Three",
    },
  });

  // Create Cornell DTI organization
  const cornellDTI = await prisma.organization.create({
    data: {
      name: "Cornell DTI",
      description:
        "Cornell Design & Tech Initiative is a project team of students dedicated to using technology to solve problems faced by communities at Cornell and beyond.",
      authorized: true,
      websiteUrl: "https://cornelldti.org",
      instagramUsername: "cornelldti",
      admins: {
        connect: [{ id: user1.id }, { id: user2.id }],
      },
    },
  });

  // Create CDS organization
  const cds = await prisma.organization.create({
    data: {
      name: "CDS",
      description:
        "Cornell Data Science is a project team that aims to make data science accessible to the Cornell community through education and project development.",
      authorized: true,
      websiteUrl: "https://cornelldata.science",
      instagramUsername: "cornelldatascience",
      admins: {
        connect: [{ id: user3.id }],
      },
    },
  });

  // Create DTI Fundraiser
  const dtiFundraiser = await prisma.fundraiser.create({
    data: {
      name: "DTI Bake Sale",
      description:
        "Buy some baked goods from DTI! All proceeds go toward supporting our projects and initiatives.",
      goalAmount: 100.0,
      pickupLocation: "Phillips Hall",
      startsAt: new Date(new Date().setDate(new Date().getDate() - 1)),
      endsAt: new Date(new Date().setDate(new Date().getDate() + 6)),
      organizationId: cornellDTI.id,
      announcements: {
        create: [
          {
            message: "Our bake sale is on! Come check us out at Phillips Hall!",
          },
        ],
      },
      items: {
        create: [
          {
            name: "Tiramisu",
            description: "Tiramisu",
            price: 5.0,
            limit: 50,
          },
          {
            name: "Chocolate Chip Cookie",
            description: "Chocolate chip cookie",
            price: 2.0,
            limit: 100,
          },
          {
            name: "Apple Pie",
            description: "Apple pie",
            price: 10.0,
            limit: 30,
          },
        ],
      },
    },
  });

  // Create CDS Fundraiser
  const cdsFundraiser = await prisma.fundraiser.create({
    data: {
      name: "CDS Merch Sale",
      description:
        "Get your Cornell Data Science merch! Show your data science passion with our limited edition items.",
      goalAmount: 750.0,
      pickupLocation: "Phillips Hall Lobby",
      imageUrls: [
        "https://example.com/cds-merch-1.jpg",
        "https://example.com/cds-merch-2.jpg",
      ],
      startsAt: new Date("2025-04-01T10:00:00Z"),
      endsAt: new Date("2025-04-10T18:00:00Z"),
      organizationId: cds.id,
      announcements: {
        create: [
          {
            message:
              "CDS Merch Sale starting soon! Don't miss out on our limited edition items.",
          },
        ],
      },
      items: {
        create: [
          {
            name: "CDS T-Shirt",
            description:
              "Stylish t-shirt with CDS logo and data visualization design",
            imageUrl: "https://example.com/cds-tshirt.jpg",
            price: 18.0,
            limit: 40,
          },
          {
            name: "CDS Stickers",
            description: "Set of data science themed vinyl stickers",
            imageUrl: "https://example.com/cds-stickers.jpg",
            price: 5.0,
            limit: 100,
          },
          {
            name: "CDS Hoodie",
            description:
              "Premium hoodie with CDS logo and data visualization design",
            imageUrl: "https://example.com/cds-hoodie.jpg",
            price: 35.0,
            limit: 25,
          },
        ],
      },
    },
  });

  // Get the items we just created for DTI
  const dtiItems = await prisma.item.findMany({
    where: {
      fundraiserId: dtiFundraiser.id,
    },
  });

  // Get the items we just created for CDS
  const cdsItems = await prisma.item.findMany({
    where: {
      fundraiserId: cdsFundraiser.id,
    },
  });

  // Create orders for DTI fundraiser
  const dtiOrder = await prisma.order.create({
    data: {
      buyerId: user3.id,
      fundraiserId: dtiFundraiser.id,
      paymentMethod: PaymentMethod.OTHER,
      paymentStatus: PaymentStatus.CONFIRMED,
      pickedUp: false,
      items: {
        create: [
          {
            quantity: 1,
            itemId: dtiItems[0].id, // Tiramisu
          },
          {
            quantity: 2,
            itemId: dtiItems[1].id, // Chocolate Chip Cookie
          },
        ],
      },
    },
  });

  // Create orders for CDS fundraiser
  const cdsOrder = await prisma.order.create({
    data: {
      buyerId: user1.id,
      fundraiserId: cdsFundraiser.id,
      paymentMethod: PaymentMethod.OTHER,
      paymentStatus: PaymentStatus.PENDING,
      pickedUp: false,
      items: {
        create: [
          {
            quantity: 1,
            itemId: cdsItems[0].id, // CDS T-Shirt
          },
          {
            quantity: 1,
            itemId: cdsItems[2].id, // CDS Hoodie
          },
        ],
      },
    },
  });

  console.log("Seed data created successfully!");
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
