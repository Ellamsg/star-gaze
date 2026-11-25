import { z } from "zod";

export const overviewQuery = z.object({
  range: z.enum(["7d", "6w", "12m"]).default("7d"),
});

export type OverviewQuery = z.infer<typeof overviewQuery>;
