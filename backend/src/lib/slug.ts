import { prisma } from "./prisma";

/** "Gel Manicure — Deluxe" -> "gel-manicure-deluxe" */
export function slugify(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "service";
}

/** Pass `excludeId` when updating so a service can keep its own slug. */
export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 1;

  while (true) {
    const existing = await prisma.service.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) return candidate;

    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
}