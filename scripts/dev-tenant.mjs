// Launch `next dev` with a default tenant pinned to the root domain, so
// http://localhost:3000 resolves to a specific store without a subdomain.
//
// Usage: node scripts/dev-tenant.mjs <slug>   (see npm run dev:jazyshouse)
import { spawn } from "node:child_process";

const slug = process.argv[2] ?? "jazyshouse";

const child = spawn("next", ["dev"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DEFAULT_TENANT_SLUG: slug },
});

child.on("exit", (code) => process.exit(code ?? 0));
