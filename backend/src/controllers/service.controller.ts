import type { Request, Response } from "express";

import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import { uniqueSlug } from "../lib/slug";
import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
} from "../validators/service.schema";

type ServiceRow = {
  id: string;
  name: string;
  slug: string;
  durationMin: number;
  price: unknown; // Prisma Decimal
  active: boolean;
  description: string | null;
  category?: { id: string; name: string; slug: string } | null;
  _count?: { appointments: number };
};

/** Category summary shown on the admin and booking pages. */
const categorySelect = { select: { id: true, name: true, slug: true } } as const;

/** Decimal -> plain number, so JSON is 7500 and not {"s":1,"e":3,"d":[7500]} */
function toDto(service: ServiceRow) {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    durationMin: service.durationMin,
    price: Number(service.price),
    active: service.active,
    description: service.description,
    categoryId: service.category?.id ?? null,
    category: service.category ?? null,
    appointmentsCount: service._count?.appointments ?? 0,
  };
}

/** A bad category id should be a clear 400, not a generic FK 409. */
async function assertCategoryExists(
  categoryId: string | null | undefined
): Promise<void> {
  if (!categoryId) return;

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) throw new HttpError(400, "Category not found");
}

/** Look up by id OR slug, so /api/services/gel-manicure works too. */
async function findService(idOrSlug: string) {
  return prisma.service.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
}

/* ------------------------------- GET /api/services ------------------------------- */

export async function listServices(req: Request, res: Response): Promise<void> {
  const { active, categoryId, q } = req.query as unknown as ListServicesQuery;

  const services = await prisma.service.findMany({
    where: {
      ...(active !== undefined ? { active } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      category: categorySelect,
      _count: { select: { appointments: true } },
    },
  });

  res.json({ data: services.map(toDto) });
}

/* ------------------------------ GET /api/services/:id ----------------------------- */

export async function getService(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const service = await prisma.service.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: {
      category: categorySelect,
      _count: { select: { appointments: true } },
    },
  });

  if (!service) throw new HttpError(404, "Service not found");

  res.json({ data: toDto(service) });
}

/* ------------------------------ POST /api/services ------------------------------- */

export async function createService(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateServiceInput;

  await assertCategoryExists(input.categoryId);

  const slug = await uniqueSlug(input.slug ?? input.name);

  const service = await prisma.service.create({
    data: {
      name: input.name,
      slug,
      durationMin: input.durationMin,
      price: input.price,
      active: input.active ?? true,
      description: input.description ?? null,
      categoryId: input.categoryId ?? null,
    },
    include: {
      category: categorySelect,
      _count: { select: { appointments: true } },
    },
  });

  res.status(201).json({ data: toDto(service) });
}

/* ----------------------------- PUT /api/services/:id ------------------------------ */

export async function updateService(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);
  const input = req.body as UpdateServiceInput;

  const existing = await findService(id);
  if (!existing) throw new HttpError(404, "Service not found");

  await assertCategoryExists(input.categoryId);

  // The slug only changes when you send one explicitly, so old URLs keep working.
  const slug =
    input.slug && input.slug !== existing.slug
      ? await uniqueSlug(input.slug, existing.id)
      : undefined;

  const service = await prisma.service.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.durationMin !== undefined ? { durationMin: input.durationMin } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(slug ? { slug } : {}),
    },
    include: {
      category: categorySelect,
      _count: { select: { appointments: true } },
    },
  });

  res.json({ data: toDto(service) });
}

/* --------------------------- DELETE /api/services/:id ----------------------------- */

export async function deleteService(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const existing = await findService(id);
  if (!existing) throw new HttpError(404, "Service not found");

  const bookings = await prisma.appointment.count({
    where: { serviceId: existing.id },
  });

  if (bookings > 0) {
    throw new HttpError(
      409,
      `"${existing.name}" is used by ${bookings} appointment${bookings === 1 ? "" : "s"} and cannot be deleted. ` +
        `Deactivate it instead (PUT /api/services/${existing.id} with { "active": false }).`
    );
  }

  /*
   * If two requests race (count says 0, a booking lands right after), the FK
   * constraint on appointments.serviceId still blocks the delete and Prisma
   * raises P2003 — errorHandler turns that into a 409.
   */
  await prisma.service.delete({ where: { id: existing.id } });

  res.status(204).send();
}