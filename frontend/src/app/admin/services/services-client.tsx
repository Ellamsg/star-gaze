"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { useAdmin } from "@/components/admin/store";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Money,
  PageHeader,
  PhotoFrame,
  Segmented,
  Select,
  Sheet,
  Skeleton,
  TextInput,
  Textarea,
  Toggle,
  cn,
} from "@/components/admin/ui";
import type { ServiceTone } from "@/data/admin";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/use-categories";
import {
  useCreateService,
  useDeleteService,
  useServices,
  useUpdateService,
} from "@/hooks/use-services";
import { formatDuration } from "@/lib/date";
import type { CategoryDTO, CategoryFormValues } from "@/types/category";
import type {
  ServiceDTO,
  ServiceFilter,
  ServiceFormValues,
} from "@/types/service";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TONES: ServiceTone[] = ["blush", "lilac", "cherry", "clay", "sage", "ink"];

const DEFAULT_VALUES: ServiceFormValues = {
  name: "",
  price: "",
  durationMin: "60",
  description: "",
  categoryId: "",
  active: true,
};

/** Stable card colour per service, since the DB has no tone column. */
function toneForService(service: ServiceDTO): ServiceTone {
  const seed = `${service.id}${service.slug}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return TONES[hash % TONES.length];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ServicesPage() {
  const { notify } = useAdmin();
  const [filter, setFilter] = useState<ServiceFilter>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ServiceDTO | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  const {
    data: services = [],
    error,
    isPending,
    isFetching,
    refetch,
  } = useServices();
  const { data: categories = [] } = useCategories();

  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  /** New services default to the first category so the form is never blank. */
  const defaultCategoryId = categories[0]?.id ?? "";

  const visible = useMemo(() => {
    return services.filter((service) => {
      if (filter === "active") return service.active;
      if (filter === "archived") return !service.active;
      return true;
    });
  }, [services, filter]);

  const counts = useMemo(
    () => ({
      all: services.length,
      active: services.filter((service) => service.active).length,
      archived: services.filter((service) => !service.active).length,
    }),
    [services]
  );

  const handleCreate = async (values: ServiceFormValues) => {
    try {
      const created = await createService.mutateAsync({
        name: values.name.trim(),
        durationMin: Number(values.durationMin),
        price: Number(values.price),
        description: values.description.trim() || undefined,
        categoryId: values.categoryId || null,
        active: values.active,
      });

      notify(`"${created.name}" added to the catalogue.`, "success");
      setCreating(false);
    } catch (mutationError) {
      notify(errorMessage(mutationError), "danger");
    }
  };

  const handleUpdate = async (values: ServiceFormValues) => {
    if (!editing) return;

    try {
      const updated = await updateService.mutateAsync({
        id: editing.id,
        payload: {
          name: values.name.trim(),
          durationMin: Number(values.durationMin),
          price: Number(values.price),
          description: values.description.trim(),
          categoryId: values.categoryId || null,
          active: values.active,
        },
      });

      notify(`"${updated.name}" updated.`, "success");
      setEditing(null);
    } catch (mutationError) {
      notify(errorMessage(mutationError), "danger");
    }
  };

  const handleDelete = async () => {
    if (!editing) return;

    if (
      !window.confirm(
        `Delete "${editing.name}"? This can't be undone. If it has bookings, archive it instead.`
      )
    ) {
      return;
    }

    try {
      await deleteService.mutateAsync(editing.id);
      notify(`"${editing.name}" deleted.`, "success");
      setEditing(null);
    } catch (mutationError) {
      // The backend returns 409 when the service still has bookings.
      notify(errorMessage(mutationError), "danger");
    }
  };

  const fetchError = error ? errorMessage(error) : null;

  return (
    <div>
      <PageHeader
        eyebrow="The menu"
        title="Services &"
        accent="prices"
        description="Everything a client can book, loaded live from the database. Edit a price, write a description, or archive a treatment without losing its booking history."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => void refetch()}
              loading={isFetching}
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </Button>
            <Button
              variant="secondary"
              icon="note"
              onClick={() => setManagingCategories(true)}
            >
              Categories
            </Button>
            <Button icon="plus" onClick={() => setCreating(true)}>
              Add service
            </Button>
          </div>
        }
      />

      <Segmented<ServiceFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All", count: counts.all },
          { value: "active", label: "Active", count: counts.active },
          { value: "archived", label: "Archived", count: counts.archived },
        ]}
        className="mb-5"
      />

      {fetchError ? (
        <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
          <p>{fetchError}</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      ) : isPending ? (
        <ServicesSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="sparkle"
          title={filter === "archived" ? "Nothing archived" : "No services here yet"}
          body={
            filter === "archived"
              ? "Services you stop offering will appear here."
              : "Add your first treatment so clients can start booking it."
          }
          action={
            filter === "all" ? (
              <Button icon="plus" size="sm" onClick={() => setCreating(true)}>
                Add service
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((service) => {
            return (
              <Card key={service.id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setEditing(service)}
                  className="flex w-full items-stretch gap-3 p-3 text-left sm:block sm:p-0"
                  aria-label={`Edit ${service.name}`}
                >
                  <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl sm:aspect-[16/10] sm:h-auto sm:w-full sm:rounded-none">
                    <PhotoFrame
                      tone={toneForService(service)}
                      label={service.name}
                      className="h-full w-full"
                      rounded="rounded-none"
                    />

                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/45 to-transparent" />

                    <div className="absolute left-2 top-2 hidden gap-1.5 sm:flex">
                      <span className="inline-flex items-center rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium leading-none text-white backdrop-blur-sm">
                        {formatDuration(service.durationMin)}
                      </span>
                      {!service.active ? (
                        <span className="inline-flex items-center rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium leading-none text-white/70 backdrop-blur-sm">
                          Archived
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-[15px] font-semibold leading-snug text-cream">
                          {service.name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-muted sm:text-xs">
                          {service.category?.name
                            ? `${service.category.name} · `
                            : ""}
                          {formatDuration(service.durationMin)} ·{" "}
                          {service.appointmentsCount === 0
                            ? "No bookings yet"
                            : `${service.appointmentsCount} booking${
                                service.appointmentsCount === 1 ? "" : "s"
                              }`}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-lg text-cream">
                        <Money value={service.price} />
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
                      <Badge tone={service.active ? "green" : "slate"}>
                        {service.active ? "Active" : "Archived"}
                      </Badge>
                    </div>

                    <p className="mt-2 hidden text-[12px] leading-relaxed text-muted/90 sm:block">
                      {service.description?.trim()
                        ? service.description
                        : "No description yet."}
                    </p>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create sheet ──────────────────────────────────────────────── */}
      <Sheet
        open={creating}
        onClose={() => setCreating(false)}
        title="New service"
        description="It appears on the booking page as soon as you save."
        footer={
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              form="service-form"
              className="flex-1"
              loading={createService.isPending}
            >
              Create service
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        }
      >
        <ServiceForm
          defaultValues={{ ...DEFAULT_VALUES, categoryId: defaultCategoryId }}
          categories={categories}
          pending={createService.isPending}
          onSubmit={handleCreate}
        />
      </Sheet>

      {/* ── Edit / detail sheet ───────────────────────────────────────── */}
      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : "Edit service"}
        description="Changes apply to new bookings only — past appointments keep their price."
        footer={
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              form="service-form"
              className="flex-1"
              loading={updateService.isPending}
            >
              Save changes
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        {editing ? (
          <ServiceForm
            key={editing.id}
            defaultValues={{
              name: editing.name,
              price: `${editing.price}`,
              durationMin: `${editing.durationMin}`,
              description: editing.description ?? "",
              categoryId: editing.categoryId ?? "",
              active: editing.active,
            }}
            categories={categories}
            bookings={editing.appointmentsCount}
            slug={editing.slug}
            pending={updateService.isPending}
            deletePending={deleteService.isPending}
            onSubmit={handleUpdate}
            onDelete={handleDelete}
          />
        ) : null}
      </Sheet>

      {/* ── Category manager ──────────────────────────────────────────── */}
      <CategoryManager
        open={managingCategories}
        onClose={() => setManagingCategories(false)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function ServicesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading services"
      className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <Skeleton className="h-[88px] w-full rounded-none sm:aspect-[16/10] sm:h-auto" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CategoryManager — add, rename and delete booking categories                */
/* -------------------------------------------------------------------------- */

function CategoryManager({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { notify } = useAdmin();
  const {
    data: categories = [],
    isPending,
    isFetching,
    error,
    refetch,
  } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({ defaultValues: { name: "" } });

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleCreate = async (values: CategoryFormValues) => {
    try {
      const created = await createCategory.mutateAsync({
        name: values.name.trim(),
      });
      notify(`"${created.name}" category added.`, "success");
      reset({ name: "" });
    } catch (mutationError) {
      notify(errorMessage(mutationError), "danger");
    }
  };

  const startRename = (category: CategoryDTO) => {
    setRenamingId(category.id);
    setRenameValue(category.name);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const saveRename = async (category: CategoryDTO) => {
    const name = renameValue.trim();
    if (!name || name === category.name) {
      cancelRename();
      return;
    }

    try {
      const updated = await updateCategory.mutateAsync({
        id: category.id,
        payload: { name },
      });
      notify(`Category renamed to "${updated.name}".`, "success");
      cancelRename();
    } catch (mutationError) {
      notify(errorMessage(mutationError), "danger");
    }
  };

  const handleDelete = async (category: CategoryDTO) => {
    if (
      !window.confirm(
        `Delete "${category.name}"? Empty categories only — move its services to another category first.`
      )
    ) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(category.id);
      notify(`"${category.name}" deleted.`, "success");
    } catch (mutationError) {
      // Backend answers 409 while services still point at the category.
      notify(errorMessage(mutationError), "danger");
    }
  };

  const fetchError = error ? errorMessage(error) : null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Categories"
      description="Group services into tabs on the booking page. Rename one, or add your own."
      footer={
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => void refetch()}
          loading={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit(handleCreate)}>
        <Field
          label="New category"
          htmlFor="category-name"
          error={errors.name?.message}
        >
          <div className="flex gap-2">
            <TextInput
              id="category-name"
              placeholder="e.g. Brows"
              autoComplete="off"
              {...register("name", {
                required: "Name is required.",
                minLength: { value: 2, message: "At least 2 characters." },
                maxLength: { value: 60, message: "At most 60 characters." },
              })}
            />
            <Button
              type="submit"
              className="shrink-0"
              loading={createCategory.isPending}
            >
              Add
            </Button>
          </div>
        </Field>
      </form>

      <div className="mt-6">
        {fetchError ? (
          <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
            <p>{fetchError}</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => void refetch()}
            >
              Try again
            </Button>
          </div>
        ) : isPending ? (
          <div role="status" aria-label="Loading categories" className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-muted">
            No categories yet. Add one above and it appears as a tab on the
            booking page.
          </p>
        ) : (
          <ul className="divide-y divide-hairline/60 overflow-hidden rounded-2xl border border-hairline/60">
            {categories.map((category) => {
              const renaming = renamingId === category.id;
              const deleting =
                deleteCategory.isPending &&
                deleteCategory.variables === category.id;

              return (
                <li key={category.id} className="px-4 py-3">
                  {renaming ? (
                    <div className="flex items-center gap-2">
                      <TextInput
                        value={renameValue}
                        onChange={(event) => setRenameValue(event.target.value)}
                        className="h-10"
                        autoFocus
                        aria-label={`Rename ${category.name}`}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void saveRename(category);
                          }
                          if (event.key === "Escape") cancelRename();
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => void saveRename(category)}
                        loading={
                          updateCategory.isPending &&
                          updateCategory.variables?.id === category.id
                        }
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelRename}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-medium text-cream">
                          {category.name}
                        </p>
                        <p className="text-[11.5px] text-muted">
                          {category.servicesCount}{" "}
                          {category.servicesCount === 1 ? "service" : "services"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startRename(category)}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon="trash"
                        aria-label={`Delete ${category.name}`}
                        loading={deleting}
                        onClick={() => void handleDelete(category)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*  ServiceForm — powered by react-hook-form                                   */
/* -------------------------------------------------------------------------- */

type ServiceFormProps = {
  defaultValues: ServiceFormValues;
  categories: CategoryDTO[];
  slug?: string;
  bookings?: number;
  pending?: boolean;
  deletePending?: boolean;
  onSubmit: (values: ServiceFormValues) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
};

function ServiceForm({
  defaultValues,
  categories,
  slug,
  bookings = 0,
  pending = false,
  deletePending = false,
  onSubmit,
  onDelete,
}: ServiceFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ServiceFormValues>({ defaultValues });

  const activeValue = useWatch({ control, name: "active" });
  const busy = pending || isSubmitting;

  return (
    <form
      id="service-form"
      className="space-y-4"
      aria-busy={busy}
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      {slug || bookings > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-hairline/60 bg-canvas/30 px-4 py-3 text-[12px] text-muted">
          {slug ? (
            <span>
              Slug: <span className="font-mono text-cream/80">{slug}</span>
            </span>
          ) : null}
          <span>
            {bookings} booking{bookings === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      {/* Name */}
      <Field label="Name" htmlFor="service-name" error={errors.name?.message}>
        <TextInput
          id="service-name"
          placeholder="e.g. Gel manicure"
          {...register("name", {
            required: "Name is required.",
            minLength: { value: 2, message: "At least 2 characters." },
            maxLength: { value: 100, message: "At most 100 characters." },
          })}
        />
      </Field>

      {/* Duration + Price */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Duration (min)" error={errors.durationMin?.message}>
          <TextInput
            inputMode="numeric"
            {...register("durationMin", {
              required: "Required.",
              validate: (value) => {
                const minutes = Number(value);
                if (!Number.isInteger(minutes)) return "Whole number only.";
                if (minutes < 5) return "Min 5 min.";
                if (minutes > 600) return "Max 600 min.";
                return true;
              },
            })}
          />
        </Field>
        <Field label="Price (₦)" htmlFor="service-price" error={errors.price?.message}>
          <TextInput
            id="service-price"
            inputMode="numeric"
            placeholder="12000"
            {...register("price", {
              required: "Price is required.",
              validate: (value) => {
                const amount = Number(value);
                if (!Number.isFinite(amount)) return "Enter a valid number.";
                if (amount < 0) return "Cannot be negative.";
                if (amount > 10_000_000) return "Price is too large.";
                return true;
              },
            })}
          />
        </Field>
      </div>

      {/* Category */}
      <Field
        label="Category"
        htmlFor="service-category"
        hint="Clients see this as a tab on the booking page."
        error={errors.categoryId?.message}
      >
        <Select id="service-category" {...register("categoryId")}>
          <option value="">Uncategorised</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </Field>

      {/* Description */}
      <Field
        label="Description"
        hint="One or two lines, in your own voice."
        error={errors.description?.message}
      >
        <Textarea
          placeholder="Shaped, buffed and finished with a high-gloss gel."
          {...register("description", {
            maxLength: { value: 1000, message: "At most 1000 characters." },
          })}
        />
      </Field>

      {/* Active toggle */}
      <div className="rounded-2xl border border-hairline/60 bg-canvas/30 px-4">
        <Toggle
          checked={activeValue}
          onChange={(value) =>
            setValue("active", value, { shouldDirty: true })
          }
          label="Bookable"
          description="Turn off to hide it from clients. Existing bookings stay untouched."
        />
      </div>

      {/* Submission state */}
      {busy ? (
        <p role="status" className="text-[12px] text-muted">
          Saving to the database…
        </p>
      ) : null}

      {/* Delete zone */}
      {onDelete ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-4">
          <p
            className={cn(
              "text-[12px] leading-relaxed",
              bookings > 0 ? "text-amber-200/90" : "text-rose-200/90"
            )}
          >
            {bookings > 0
              ? `This service is on ${bookings} booking${
                  bookings === 1 ? "" : "s"
                }, so the database won't let it be deleted. Archive it instead.`
              : "Deleting is permanent. If you only want to pause it, switch Bookable off."}
          </p>
          <Button
            variant="danger"
            size="sm"
            className="mt-3"
            loading={deletePending}
            disabled={bookings > 0}
            onClick={() => void onDelete()}
          >
            {deletePending ? "Deleting…" : "Delete service"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
