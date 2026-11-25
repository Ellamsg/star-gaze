import "dotenv/config";

import { hashPassword } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";
import {
  arg,
  assertEmail,
  promptLine,
  readNewPassword,
} from "./admin-cli";

async function main() {
  const emailInput =
    arg("email") ?? process.env.ADMIN_EMAIL ?? (await promptLine("Admin email: "));

  const email = assertEmail(emailInput);

  const existing = await prisma.admin.findUnique({ where: { email } });

  if (existing) {
    throw new Error(
      `An admin with ${email} already exists. Use admin:reset-password instead.`
    );
  }

  const name =
    arg("name")?.trim() ||
    process.env.ADMIN_NAME?.trim() ||
    email.split("@")[0];

  const password = await readNewPassword("Password");
  const passwordHash = await hashPassword(password);

  const admin = await prisma.admin.create({
    data: {
      email,
      name,
      passwordHash,
      role: "OWNER",
      isActive: true,
      mustChangePassword: false,
      passwordChangedAt: new Date(),
    },
  });

  console.log(`Admin created: ${admin.email} (${admin.name})`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
