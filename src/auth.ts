import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * NextAuth v5 (Auth.js) — credentials (email/password) backed by the `User`
 * model. JWT session strategy (required for the Credentials provider).
 *
 * SECURITY / TENANCY NOTES
 * ────────────────────────
 * - `token.tenantId` is the user's HOME tenant (null for SUPER_ADMIN).
 * - `token.activeTenantId` is the tenant currently being administered. Only a
 *   SUPER_ADMIN may change it (tenant switcher). A TENANT_ADMIN's active tenant
 *   is pinned to their own tenant and CANNOT be changed via the update trigger —
 *   this is the load-bearing guard that stops a tenant admin scoping to another
 *   store's data.
 * - This module runs in the Node runtime (Prisma + bcrypt). It is NOT imported
 *   by middleware, so the Edge runtime never loads Prisma.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  trustHost: true,
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // No user, or an account that has never set a password (OAuth-only /
        // seeded customer) → reject. Never reveal which case it was.
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    authorized: ({ auth: session }) => !!session,
    jwt: async ({ token, user, trigger, session }) => {
      // On sign-in, copy identity claims onto the token.
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId ?? null;
        // Default active tenant: tenant admins administer their own tenant;
        // super admins start on the first tenant (if any) until they switch.
        if (user.tenantId) {
          token.activeTenantId = user.tenantId;
        } else {
          const first = await prisma.tenant.findFirst({
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });
          token.activeTenantId = first?.id ?? null;
        }
      }

      // Tenant switcher: `useSession().update({ activeTenantId })` triggers this.
      // ONLY a super admin may move the active tenant — anyone else is ignored.
      if (trigger === "update" && token.role === "SUPER_ADMIN") {
        const next = (session as { activeTenantId?: string | null } | undefined)
          ?.activeTenantId;
        if (next !== undefined) token.activeTenantId = next;
      }

      return token;
    },
    session: ({ session, token }) => {
      // NextAuth v5 types the JWT via @auth/core; cast our custom claims so the
      // strongly-typed (augmented) Session fields receive correct values.
      session.user.id = token.sub ?? "";
      session.user.role = token.role as UserRole;
      session.user.tenantId = (token.tenantId as string | null) ?? null;
      session.activeTenantId = (token.activeTenantId as string | null) ?? null;
      return session;
    },
  },
});
