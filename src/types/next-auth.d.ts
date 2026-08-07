import type { UserRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

/**
 * Module augmentation so the role / tenant claims we attach in the auth
 * callbacks are strongly typed everywhere `auth()` / `useSession()` is used.
 */
declare module "next-auth" {
  interface Session {
    /** Tenant currently being administered (super admin can switch). */
    activeTenantId: string | null;
    user: {
      id: string;
      role: UserRole;
      /** Home tenant; null = SUPER_ADMIN. */
      tenantId: string | null;
      /** Version checked server-side to revoke privileged JWT sessions. */
      authVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
    tenantId: string | null;
    authVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    tenantId: string | null;
    activeTenantId: string | null;
    authVersion: number;
  }
}
