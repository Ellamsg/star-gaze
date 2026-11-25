import argon2 from "argon2";

/**
 * OWASP-recommended argon2id settings for a single-server app.
 * The hash embeds the salt and parameters, so nothing else is stored.
 */
const HASH_OPTIONS = {
  type: 2 as const, // argon2id
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, HASH_OPTIONS);
}

export function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  return argon2.verify(passwordHash, password).catch(() => false);
}

/**
 * Used when an email does not exist, so a failed login costs the same
 * amount of work whether or not the account is real.
 */
const dummyHash = hashPassword("not-a-real-admin-password");

export async function burnPasswordCheck(password: string): Promise<void> {
  await verifyPassword(await dummyHash, password);
}
