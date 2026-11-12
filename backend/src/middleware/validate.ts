import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { HttpError } from "../lib/http-error";

type RequestPart = "body" | "query" | "params";
type Schemas = Partial<Record<RequestPart, ZodType>>;

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part] ?? {});

      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          field: issue.path.join(".") || part,
          message: issue.message,
        }));

        next(new HttpError(400, "Validation failed", details));
        return;
      }

      Object.defineProperty(req, part, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };
}