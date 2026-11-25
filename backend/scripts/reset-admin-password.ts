import "dotenv/config";

import { hashPassword } from "../src/lib/password";
import { prisma } from "../src/lib/prisma";
import { revokeAllSessions } from "../src/lib/session";
import {
  arg,
  assertEmail,
  promptLine,
  readNewPassword,
} from "./admin-cli";

async function main() {
  const emailInput =
    arg("email") ??
    process.env.ADMIN_EMAIL ??
    (await promptLine("Admin email: "));

  const email = assertEmail(emailInput);

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    throw new Error(`No admin found for ${email}.`);
  }

  const password = await readNewPassword("New password");
  const passwordHash = await hashPassword(password);

  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      passwordChangedAt: new Date(),
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await revokeAllSessions(admin.id);

  console.log(`Password reset for ${admin.email}. All sessions were signed out.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
