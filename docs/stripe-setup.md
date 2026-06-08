     1|# Stripe Setup Guide — Jazy's House Platform
     2|
     3|How to wire up Stripe Checkout for this project, from local TEST keys through to
     4|LIVE keys on Vercel.
     5|
     6|This platform creates Checkout sessions **server-side** and confirms payment via
     7|a **signed webhook**. The Stripe secret key never reaches the browser. Money is
     8|stored as integer **minor units** (e.g. pence), not decimals.
     9|
    10|Relevant files:
    11|
    12|- Webhook handler: `src/app/api/webhooks/stripe/route.ts` (public path `/api/webhooks/stripe`)
    13|- Checkout session creation: `src/app/(store)/checkout/actions.ts`
    14|- Env template: `.env.example`
    15|
    16|---
    17|
    18|## 1. Get your TEST API keys
    19|
    20|1. Sign in to the [Stripe Dashboard](https://dashboard.stripe.com).
    21|2. Make sure **Test mode** is toggled ON (top-right of the Dashboard).
    22|3. Go to **Developers → API keys**.
    23|4. Copy the two keys into your local `.env` (copy from `.env.example` if you
    24|   have not already):
    25|
    26|   ```bash
    27|   # Server-only secret key — NEVER expose this to the client / commit it.
    28|   STRIPE_SECRET_KEY="sk_tes...E_ME"
    29|
    30|   # Publishable key — safe to ship to the browser (NEXT_PUBLIC_ prefix).
    31|   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxxxxx"
    32|   ```
    33|
    34|> **Important — the secret key is server-only.**
    35|> `STRIPE_SECRET_KEY` (`sk_test_…`) has **no** `NEXT_PUBLIC_` prefix on purpose:
    36|> anything prefixed `NEXT_PUBLIC_` is inlined into the client bundle. The secret
    37|> key must stay on the server. Only the publishable key (`pk_test_…`) is exposed
    38|> to the browser. If you ever leak a secret key, roll it immediately in
    39|> **Developers → API keys**.
    40|
    41|---
    42|
    43|## 2. Set up the webhook endpoint
    44|
    45|The handler lives at `src/app/api/webhooks/stripe/route.ts` and is served at the
    46|public path **`/api/webhooks/stripe`**. Every request is verified against
    47|`STRIPE_WEBHOOK_SECRET` using the raw request body — an unsigned or mis-signed
    48|request is rejected with `400` before any database work happens.
    49|
    50|To register the endpoint with Stripe:
    51|
    52|1. In the Dashboard (Test mode), go to **Developers → Webhooks → Add endpoint**.
    53|2. **Endpoint URL:** your deployed base URL + `/api/webhooks/stripe`
    54|   (for local development, use the Stripe CLI instead — see step 3).
    55|3. **Events to send:** at minimum the events the handler acts on:
    56|   - `checkout.session.completed` — marks the order paid (`PENDING → PROCESSING`)
    57|   - `checkout.session.expired` — releases reserved stock for abandoned checkouts
    58|   - `payment_intent.payment_failed` — logged (order stays `PENDING`)
    59|   - `charge.refunded` — logged (refunds reconciled manually for now)
    60|4. After creating the endpoint, click **Reveal** on the **Signing secret** and
    61|   copy it into `.env`:
    62|
    63|   ```bash
    64|   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxx"
    65|   ```
    66|
    67|> The signing secret is what proves a webhook request genuinely came from Stripe.
    68|> The local CLI secret (step 3) and the Dashboard endpoint secret are **different
    69|> values** — use the right one per environment.
    70|
    71|---
    72|
    73|## 3. Test locally with the Stripe CLI
    74|
    75|For local development you do not register a public URL — the
    76|[Stripe CLI](https://docs.stripe.com/stripe-cli) forwards events to your machine.
    77|
    78|1. **Log in** (one-time, opens a browser to authorise):
    79|
    80|   ```bash
    81|   stripe login
    82|   ```
    83|
    84|2. **Forward events** to your local webhook handler (assumes `npm run dev` is
    85|   running on port 3000):
    86|
    87|   ```bash
    88|   stripe listen --forward-to localhost:3000/api/webhooks/stripe
    89|   ```
    90|
    91|   On start this prints a **local webhook signing secret** like
    92|   `whsec_…`. Copy that value into your `.env` as `STRIPE_WEBHOOK_SECRET` and
    93|   restart `npm run dev` so the handler picks it up.
    94|
    95|   ```
    96|   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxx (^C to quit)
    97|   ```
    98|
    99|3. **Trigger a test event** (in a second terminal, while `stripe listen` runs):
   100|
   101|   ```bash
   102|   stripe trigger checkout.session.completed
   103|   ```
   104|
   105|4. **Or test the real flow end to end:** start `npm run dev`, add items to a
   106|   cart, go through checkout, and pay on the Stripe-hosted page with the test
   107|   card:
   108|
   109|   | Field        | Value                      |
   110|   | ------------ | -------------------------- |
   111|   | Card number  | `4242 4242 4242 4242`      |
   112|   | Expiry       | any future date            |
   113|   | CVC          | any 3 digits               |
   114|   | Postcode/ZIP | any value                  |
   115|
   116|   Watch the `stripe listen` terminal for the forwarded event and your
   117|   `npm run dev` logs for the handler output.
   118|
   119|---
   120|
   121|## 4. How checkout works in this project
   122|
   123|The flow is server-driven so the secret key and the authoritative prices never
   124|touch the client:
   125|
   126|1. **Session created server-side** in `src/app/(store)/checkout/actions.ts`
   127|   (`placeOrder`, a Server Action). The tenant is resolved from the request host;
   128|   the cart is **re-priced against the database** (`verifyCart`) — client-supplied
   129|   prices are ignored.
   130|2. **Order + stock committed atomically** in a single Prisma transaction (the
   131|   per-line stock decrement is a conditional `stock >= quantity` write, so a
   132|   concurrent sale can't oversell). The order is created with status `PENDING`.
   133|3. **Stripe Checkout Session created** from the *verified* line items, then the
   134|   browser is redirected to the Stripe-hosted page (`session.url`).
   135|   - Line-item amounts use `unit_amount` in **minor units** (integer pence) —
   136|     matching how money is stored (`Int` columns). Do not convert to decimals.
   137|   - The session carries `metadata: { orderId, tenantId }`; the webhook uses
   138|     these to bind the paid session back to the correct order **and** enforce a
   139|     tenant fence (it refuses to mutate on a missing/mismatched `tenantId`).
   140|4. **Redirect URLs** are built from the **request origin** (so the customer
   141|   returns to the same storefront subdomain / custom domain they bought from):
   142|   - `success_url`: `<origin>/checkout/confirmation?session_id={CHECKOUT_SESSION_ID}`
   143|   - `cancel_url`: `<origin>/cart`
   144|
   145|   When no request host is available, the origin falls back to
   146|   **`NEXT_PUBLIC_APP_URL`** — so set it correctly per environment
   147|   (dev: `http://localhost:3000`; prod: your canonical `https://` URL).
   148|5. **Webhook confirms payment.** On `checkout.session.completed` the handler
   149|   advances the order `PENDING → PROCESSING`. Confirmation is **idempotent**:
   150|   the processed `stripeEventId` is recorded so Stripe's at-least-once retries
   151|   never double-apply a payment.
   152|
   153|> The success page redirect alone does **not** mark an order paid — the webhook
   154|> does. Always keep the webhook running (locally via the CLI, in prod via a
   155|> registered endpoint) or paid orders will stay stuck `PENDING`.
   156|
   157|---
   158|
   159|## 5. Switch to LIVE keys
   160|
   161|Do this only when you are ready to take real payments on the deployed site.
   162|
   163|1. **Toggle the Dashboard to Live mode** (top-right; turn Test mode OFF).
   164|2. **Swap the API keys** in your production environment (Vercel) for live ones
   165|   from **Developers → API keys** (Live mode):
   166|
   167|   ```bash
   168|   STRIPE_SECRET_KEY="sk_liv...E_ME"
   169|   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
   170|   ```
   171|
   172|3. **Create a LIVE webhook endpoint** (Developers → Webhooks → Add endpoint, in
   173|   Live mode) pointing at your deployed HTTPS URL + the webhook path:
   174|
   175|   ```
   176|   https://<your-domain>/api/webhooks/stripe
   177|   ```
   178|
   179|   Subscribe to the same events as in step 2 (`checkout.session.completed`,
   180|   `checkout.session.expired`, `payment_intent.payment_failed`,
   181|   `charge.refunded`).
   182|
   183|4. **Update `STRIPE_WEBHOOK_SECRET`** with the *live* endpoint's signing secret
   184|   in **Vercel → Project → Settings → Environment Variables** (and re-deploy /
   185|   redeploy so it takes effect).
   186|
   187|5. **Confirm `NEXT_PUBLIC_APP_URL`** in Vercel is your canonical `https://` URL
   188|   so any fallback redirect targets the live site, not localhost.
   189|
   190|> Live and test keys/secrets are completely separate. Never mix a live secret key
   191|> with a test webhook secret (or vice versa) — signature verification will fail.
   192|