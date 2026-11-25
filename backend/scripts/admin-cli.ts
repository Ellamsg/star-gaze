import { createInterface as createReadline } from "node:readline";
import { createInterface as createPromptInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { z } from "zod";

import { passwordSchema } from "../src/validators/auth.schema";

export function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

export async function promptLine(question: string): Promise<string> {
  const rl = createPromptInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

/** Hides typed characters while still showing the prompt. */
export function promptHidden(question: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = createReadline({
      input: stdin,
      output: stdout,
      terminal: true,
    });

    let muted = false;
    const target = rl as unknown as {
      _writeToOutput?: (text: string) => void;
    };
    const original = target._writeToOutput?.bind(rl);

    target._writeToOutput = (text: string) => {
      if (!muted) original?.(text);
    };

    rl.on("SIGINT", () => {
      rl.close();
      reject(new Error("Cancelled."));
    });

    rl.question(question, (answer) => {
      muted = false;
      rl.close();
      stdout.write("\n");
      resolve(answer);
    });

    muted = true;
  });
}

export function assertEmail(email: string): string {
  const result = z.string().trim().toLowerCase().email().max(320).safeParse(email);

  if (!result.success) {
    throw new Error("Enter a valid email address.");
  }

  return result.data;
}

export function assertStrongPassword(password: string): string {
  const parsed = passwordSchema.safeParse(password);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `- ${issue.message}`);
    throw new Error(`Password is too weak:\n${issues.join("\n")}`);
  }

  return parsed.data;
}

export async function readNewPassword(
  label = "Password"
): Promise<string> {
  const fromEnv = process.env.ADMIN_PASSWORD;

  // The env var exists for non-interactive runs (CI, a one-off deploy). It
  // must still meet the same policy as a typed password.
  if (fromEnv !== undefined) {
    return assertStrongPassword(fromEnv);
  }

  if (!stdin.isTTY) {
    throw new Error(
      "No terminal available. Set ADMIN_PASSWORD for non-interactive use."
    );
  }

  const password = await promptHidden(`${label}: `);

  if (password.length === 0) {
    throw new Error("Password cannot be empty.");
  }

  assertStrongPassword(password);

  const confirm = await promptHidden("Confirm password: ");

  if (password !== confirm) {
    throw new Error("Passwords do not match.");
  }

  return password;
}
