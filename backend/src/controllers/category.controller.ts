import type { Request, Response } from "express";

import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";
import { slugify } from "../lib/slug";
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "../validators/category.schema";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  active: boolean;
  _count?: { services: number };
};

function toDto(category: CategoryRow) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
    active: category.active,
    servicesCount: category._count?.services ?? 0,
  };
}

/** Look up by id OR slug, so /api/categories/nails works too. */
async function findCategory(idOrSlug: string) {
  return prisma.category.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
}

/** Category slugs are unique, so retry with -2, -3… when one is taken. */
async function uniqueCategorySlug(
  base: string,
  excludeId?: string
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let suffix = 1;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === excludeId) return candidate;

    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
}

/* ------------------------------ GET /api/categories ----------------------------- */

export async function listCategories(
  req: Request,
  res: Response
): Promise<void> {
  const { active } = req.query as unknown as ListCategoriesQuery;

  const categories = await prisma.category.findMany({
    where: active !== undefined ? { active } : {},
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { services: true } } },
  });

  res.json({ data: categories.map(toDto) });
}

/* --------------------------- GET /api/categories/:id ---------------------------- */

export async function getCategory(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  const category = await prisma.category.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { _count: { select: { services: true } } },
  });

  if (!category) throw new HttpError(404, "Category not found");

  res.json({ data: toDto(category) });
}

/* ------------------------------ POST /api/categories ---------------------------- */

export async function createCategory(
  req: Request,
  res: Response
): Promise<void> {
  const input = req.body as CreateCategoryInput;

  const slug = await uniqueCategorySlug(input.slug ?? input.name);

  const category = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    },
    include: { _count: { select: { services: true } } },
  });

  res.status(201).json({ data: toDto(category) });
}

/* --------------------------- PUT /api/categories/:id ---------------------------- */

export async function updateCategory(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id);
  const input = req.body as UpdateCategoryInput;

  const existing = await findCategory(id);
  if (!existing) throw new HttpError(404, "Category not found");

  const slug =
    input.slug && input.slug !== existing.slug
      ? await uniqueCategorySlug(input.slug, existing.id)
      : undefined;

  const category = await prisma.category.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(slug ? { slug } : {}),
    },
    include: { _count: { select: { services: true } } },
  });

  res.json({ data: toDto(category) });
}

/* -------------------------- DELETE /api/categories/:id -------------------------- */

export async function deleteCategory(
  req: Request,
  res: Response
): Promise<void> {
  const id = String(req.params.id);

  const existing = await findCategory(id);
  if (!existing) throw new HttpError(404, "Category not found");

  const services = await prisma.service.count({
    where: { categoryId: existing.id },
  });

  if (services > 0) {
    throw new HttpError(
      409,
      `"${existing.name}" still has ${services} service${
        services === 1 ? "" : "s"
      }. Move them to another category first.`
    );
  }

  await prisma.category.delete({ where: { id: existing.id } });

  res.status(204).send();
}
