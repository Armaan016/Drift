import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      email: "test@example.com",
      username: "testuser",
      image: "",
      accounts: {
        create: {
          type: "oauth",
          provider: "github",
          providerAccountId: "123456789", // Fake GitHub ID
        },
      },
    },
  });

  console.log("Test user created!");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
