import type { AdminRole } from "../generated/prisma/enums";

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        email: string;
        name: string;
        role: AdminRole;
        sessionId: string;
        mustChangePassword: boolean;
      };
    }
  }
}

export {};
