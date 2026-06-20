# JH-004 — Adversary Audit Report (THE ADVERSARY — Lex Luthor)

> **Seat:** 5 (THE ADVERSARY — Lex Luthor)  
> **Model:** Gemini 3.5 Flash  
> **Status:** AUDITED — ACTION REQUIRED  

I have scrutinized the infrastructure and codebase of the Jazy's House Platform. Below is the breakdown of the security posture, identified attack vectors, and the kryptonite findings that must be resolved before proceeding.

---

## ⚡ I Found Your Kryptonite (Top 3 Findings)

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  1. TENANT HIJACK / CONTEXT SPOOFING VIA x-tenant-slug HEADER INJECTION   ║
║     Severity: CRITICAL  ·  Exploit: Client-controlled tenant context      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  2. SHARED PAYMENT PROCESSOR & FINANCIAL ISOLATION LEAK                   ║
║     Severity: HIGH      ·  Exploit: Cross-tenant dashboard data access    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  3. UNPROTECTED SERVER UTILITIES & NEXT.JS BUNDLING RISK                  ║
║     Severity: MEDIUM    ·  Exploit: Server-only modules leaked to client  ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 🔍 Detailed Vulnerability Log

### 1. Tenant Context Hijack via `x-tenant-slug` Header Injection
* **Severity:** 🔴 CRITICAL
* **Exploitation Scenario:**
  In [middleware.ts](file:///C:/Users/Tevin/source/repos/jazyshouse-platform/src/middleware.ts#L16-L36), incoming client headers are cloned directly via `new Headers(request.headers)`. If a malicious visitor sends an HTTP request directly to a storefront domain (e.g. `jazyshouse.com`) and manually attaches the custom header `x-tenant-slug: othertenant`, the middleware forwards this header without sanitization.
  The tenant resolution helper [tenant.ts](file:///C:/Users/Tevin/source/repos/jazyshouse-platform/src/lib/tenant.ts#L79-L86) checks for `x-tenant-slug` first. Since it finds the injected header, it bypasses the host check and resolves the tenant to `othertenant`.
  This allows an attacker to hijack the tenant context on any page or action, enabling them to query other stores' catalog data, submit fake catering inquiries, or place checkout orders against different tenants.
* **Fix Recommendation:**
  Modify `middleware.ts` to explicitly delete `x-tenant-slug` and `x-tenant-host` from the incoming headers before cloning them, or ensure they are only populated when the path matches the `/store/<slug>` dev route format.
  ```typescript
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-tenant-slug");
  requestHeaders.delete("x-tenant-host");
  ```

### 2. Shared Stripe Account & Multi-Tenant Financial Isolation Leak
* **Severity:** 🟠 HIGH
* **Exploitation Scenario:**
  The platform currently relies on a single, global `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`. All payments are routed to this single Stripe account, utilizing metadata (`tenantId`) to classify orders in the webhook receiver.
  If a tenant admin needs to inspect payment attempts, handle disputes, or process refunds, they must be granted dashboard access. Because all tenants share the same Stripe account, any user with access to the dashboard will have full visibility into the customer data, transaction volumes, and financial details of *all* other tenants on the platform, violating GDPR/privacy regulations and tenant isolation.
* **Fix Recommendation:**
  1. **Option A (Stripe Connect):** Transition to Stripe Connect (Express or Custom accounts). Each tenant is onboarded as a separate connected account. Payouts and client data are isolated, and the platform can automatically levy application fees.
  2. **Option B (Dynamic Credentials):** Store each tenant's specific `stripeSecretKey` and `stripeWebhookSecret` encrypted in the `Tenant` table, and instantiate the Stripe SDK dynamically in the route handler based on the resolved tenant.

### 3. Missing `server-only` Guard on Core Database & Stripe Files
* **Severity:** 🟡 MEDIUM
* **Exploitation Scenario:**
  Files like [db.ts](file:///C:/Users/Tevin/source/repos/jazyshouse-platform/src/lib/db.ts) and [stripe.ts](file:///C:/Users/Tevin/source/repos/jazyshouse-platform/src/lib/stripe.ts) export core singletons. While `stripe.ts` uses `"server-only"`, `db.ts` does not. If a developer accidentally imports the `prisma` singleton from `db.ts` into a client-side component, Next.js will attempt to bundle it, leaking internal schema structures or failing compilation during production builds due to native binding imports.
* **Fix Recommendation:**
  Add `"server-only"` to the top of all backend utility files under `src/lib/` to enforce compiler-level import isolation.
  ```typescript
  import "server-only";
  ```

### 4. Supply Chain Vulnerability (High Severity in `undici` dependency)
* **Severity:** 🟠 HIGH
* **Exploitation Scenario:**
  Running `npm audit` reveals a high-severity vulnerability in the `undici` library (vulnerable range: `7.0.0 - 7.27.2`), which Next.js uses internally for server-side `fetch` operations. The vulnerability details TLS certificate validation bypass via a dropped `requestTls` parameter in the `SOCKS5 ProxyAgent`. If the platform relies on external SOCKS5 proxies to fetch data (e.g. images, external catalog feeds), an attacker could execute a Man-in-the-Middle (MITM) attack to hijack requests.
* **Fix Recommendation:**
  Update the lockfile and force undici to resolve to a non-vulnerable version.
  ```bash
  npm update undici
  ```

### 5. Server-Side Request Forgery (SSRF) via Product Image URL Input
* **Severity:** 🟡 MEDIUM
* **Exploitation Scenario:**
  In [actions.ts](file:///C:/Users/Tevin/source/repos/jazyshouse-platform/src/app/%28admin%29/admin/products/actions.ts#L35-L45), the product form parser validates image URLs by checking if they can be parsed and use the `http:` or `https:` protocol. There are no restrictions on the domain.
  If the Next.js server attempts to fetch or optimize the image (e.g. if the storefront uses Next.js image optimization or the backend pre-fetches the image), an admin could supply an internal URL (e.g. `http://169.254.169.254/latest/meta-data/` or internal ports like `http://localhost:5432`) to scan ports or access local instance metadata.
* **Fix Recommendation:**
  Restrict user-supplied URLs to whitelist patterns matching the active storage provider (e.g. only allow Cloudflare R2 / Vercel Blob domains). In the server action, ensure any incoming URL is resolved and checked to block local loopback (`127.0.0.1`) and private IP subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).

### 6. Predictable S3/R2 Naming & Enumeration (Future Storage Vector)
* **Severity:** 🟢 LOW
* **Exploitation Scenario:**
  If the platform integrates Cloudflare R2/S3 storage for product images and uses sequential naming (e.g. `product-1.jpg`, `product-2.jpg`) or predictable hashes (e.g. slug names), an attacker can easily enumerate all uploaded files, bypass storefront access controls, and scrape assets.
* **Fix Recommendation:**
  Implement cryptographically secure random names (e.g. UUID v4 or random SHA-256 hashes of the file content) for all uploads, and ensure bucket policies are set to private, serving public product images through an authenticated CDN or signed URLs if access control is needed.

---

## 🛡️ Audit Conclusion
The current tenant-scoped Prisma design is highly robust, utilizing multi-layered checks on Server Actions and layouts. However, the **`x-tenant-slug` header forwarding** bypasses the entire multi-tenant separation layer at the middleware boundary. This, combined with the **shared Stripe account model**, represents the immediate priority areas for security remediation before storefront deployment proceeds.
