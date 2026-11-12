/** Shape returned by GET /api/services and GET /api/services/:id */
export type ServiceDTO = {
  id: string;
  name: string;
  slug: string;
  durationMin: number;
  price: number;
  active: boolean;
  description: string | null;
  appointmentsCount: number;
};

/** Body sent to POST /api/services */
export type CreateServicePayload = {
  name: string;
  durationMin: number;
  price: number;
  active?: boolean;
  description?: string;
  /** Optional — auto-generated from name if omitted */
  slug?: string;
};

/** Body sent to PUT /api/services/:id — all fields optional but at least one required */
export type UpdateServicePayload = Partial<CreateServicePayload>;

/** Query params for GET /api/services */
export type ListServicesParams = {
  active?: boolean;
  q?: string;
};

/** Values managed by react-hook-form on the service create/edit sheet. */
export type ServiceFormValues = {
  name: string;
  price: string;
  durationMin: string;
  description: string;
  active: boolean;
};

/** Tabs on the services page. */
export type ServiceFilter = "all" | "active" | "archived";
