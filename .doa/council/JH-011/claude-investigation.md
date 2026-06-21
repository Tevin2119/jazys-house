27KB written. The investigation is complete.

---

## Seat 1 (Claude Code) — Investigation Complete

`claude-investigation.md` written to `.doa/council/JH-011/` — 27KB, 8 sections.

### Key findings for other council seats:

**Payments:**
- **LINE Pay Japan: dead.** Terminated April 30, 2025. Remove from scope entirely.
- **KOMOJU is the pragmatic choice** for non-Japan-incorporated businesses — single REST API covers PayPay, konbini (including Seven-Eleven, which Stripe misses), bank transfer, Rakuten Pay, Merpay, au PAY. No npm package — budget time to build a typed wrapper.
- **Stripe covers PayPay + konbini + furikomi** if a Japan Stripe account is obtainable. Konbini needs ~30-day activation review.
- **JPY zero-decimal bug exists** in current code — `Order.total` divided by 100 for display will break for yen.

**Shipping:**
- **No direct carrier API is realistic for JH-011.** Yamato: ~3 month onboarding, no sandbox. Sagawa: Japan address required for corporate account. Japan Post: no public REST tracking API at all.
- **Ship&co is the only viable path** — single English REST API covering Yamato + Sagawa + Japan Post for both label generation and tracking. 30-day free trial, test mode works immediately.
- **SAL is suspended** — don't spec it.
- **Vercel rotating IPs will break Japan Post's Digital Address API** in production — that API requires a static IP.

**Current system:** Stripe checkout is solid. Everything else (shipping, email, granular permissions, audit trail) is missing. The `OrderStatusLog`, `OrderShipment`, `OrderMessage`, and `SentEmail` models all need to be created.

**Docs consulted:** CODING-STANDARDS.md (Prisma conventions, tenant-first patterns), prisma/schema.prisma (existing models), CLAUDE.md (Council workflow).
s` — signed, idempotent webhook handler
- `src/app/(store)/checkout/actions.ts` — server action: cart verified, stock decremented atomically, Stripe session created server-side
- Handles: `checkout.session.completed` → order PENDING → PROCESSING; `checkout.session.expired` → stock released
- Multi-tenant: shared Stripe account, per-order `metadata.tenantId` fence

**Order Status Machine:** Functional but minimal.
- `src/lib/order-status.ts` — enum + `allowedNextStatuses()` transition graph
- States: `PENDING | PROCESSING | SHIPPED | DELIVERED | CANCELLED`
- Admin can manually advance; webhook auto-advances PENDING → PROCESSING
- Missing: audit trail, auto-transitions, batch ops, order notes

**Roles:** 6-level hierarchy defined, partial enforcement.
- `SUPER_ADMIN | TENANT_ADMIN | OWNER | ADMIN | EMPLOYEE | CUSTOMER`
- `TenantMembership` table enables cross-tenant roles (from JH-004)
- `requireAdmin()`, `requireSuperAdmin()`, `canAccessTenant()` guards exist
- Missing: OWNER/ADMIN/EMPLOYEE have no special handling beyond the enum; no granular permissions; no activity log

**Communications:** Placeholder only.
- Email field captured on orders and catering inquiries
- No Resend integration, no transactional emails, no message threads

**Shipping:** Address snapshot only.
- `Order.address` stores shipping address as JSON
- No carrier integration, no labels, no tracking, no fulfillment workflow

### Relevant Schema Fields

```prisma
Order {
  id              String @id (CUID)
  tenantId        String
  status          OrderStatus  // PENDING|PROCESSING|SHIPPED|DELIVERED|CANCELLED
  total           Int          // minor units (pence, etc.)
  currency        String @default("gbp")  // ISO 4217 lowercase
  address         Json?        // shipping address snapshot
  stripeSessionId String? @unique
  stripeEventId   String? @unique
}

Tenant {
  currency  String @default("gbp")
}

enum UserRole { SUPER_ADMIN | OWNER | ADMIN | EMPLOYEE | TENANT_ADMIN | CUSTOMER }
```

### Schema Models Missing (JH-011 scope)

```
ShippingCarrier     -- carrier config per tenant (Yamato, Sagawa, etc.)
OrderShipment       -- tracking number, carrier, label URL, status
ShipmentEvent       -- tracking history per shipment
OrderMessage        -- per-order message thread (admin <-> customer, isPublic flag)
OrderNote           -- admin-only notes
OrderStatusLog      -- audit trail: who changed status, when, why
SentEmail           -- outbox/delivery log
UserPermission      -- granular permission grants per user per tenant
ActivityLog         -- who did what, when, on which resource
```

---

## Part 2 — Japan Payment APIs

### 2.1 PayPay

**Direct API:**
- Package: `@paypayopa/paypayopa-sdk-node` (official npm, TypeScript, v2.2.0 June 2026)
- Auth: HMAC via `PAYPAY.Configure({ env, clientId, clientSecret, merchantId })`
- Supports: QR code, native/debit, pre-auth/capture, refunds
- **CRITICAL RESTRICTION:** Foreign (non-Japan-incorporated) companies CANNOT register directly. PayPay's own FAQ confirms this explicitly.
- SDK maintenance warning: README states "ongoing maintenance is limited"

**Via Stripe (if Japan Stripe account is obtainable):**
- `payment_method_types: ['paypay']`
- Fee: 3.98% (9.48% for digital content)
- No manual capture — always auto-captured
- No Stripe Connect support; no recurring payments
- Japan Stripe account required; JPY only

**Via KOMOJU (recommended for foreign companies):**
- `payment_details.type: "paypay"` — redirect flow
- Webhook: `payment.captured`
- No Japan incorporation required

### 2.2 LINE Pay

**STATUS: TERMINATED IN JAPAN — DO NOT IMPLEMENT**

LY Corporation terminated LINE Pay Japan on April 30, 2025. New merchant applications closed July 30, 2024. Service merged into PayPay.

LINE Pay still operates in Taiwan and Thailand only. The `line-pay-merchant` npm covers V4 API if those markets are ever targeted.

### 2.3 Konbini (Convenience Store Payment)

How it works: merchant creates payment code → customer goes to a physical convenience store → pays cash with code → merchant receives webhook → order proceeds.

**Via Stripe:**
- `payment_method_types: ['konbini']`
- Supported stores: FamilyMart, Lawson, Ministop, Seicomart
- **Seven-Eleven NOT supported by Stripe** (Seven-Eleven is Japan's largest chain)
- Max: ¥300,000; Expiry: configurable `expires_after_days` (default 3)
- Fee: 3.6% + minimum ¥120; refund fee: ¥250 + 10% tax
- Customer instruction URL: `next_action.konbini_display_details.hosted_voucher_url`
- Webhook: `payment_intent.succeeded` when paid at store
- **Activation: ~30-day Dashboard review process**
- Requires Japan-based Stripe account

**Via KOMOJU:**
- `payment_details.type: "konbini"`, `"store": "seven-eleven"` (or family-mart, lawson, etc.)
- Covers Seven-Eleven — Stripe does not
- Returns `payment_details.instructions_url` (KOMOJU-hosted)
- No Japan incorporation required

### 2.4 Bank Transfer (Furikomi)

**Via Stripe:**
- `payment_method_types: ['customer_balance']`
- Fee: 1.5%
- **Requires Stripe Customer object on the PaymentIntent** — errors without `customer` field
- Automated reconciliation; webhook `payment_intent.succeeded`

**Via KOMOJU:**
- `payment_details.type: "bank_transfer"`
- Response includes bank name, branch, account number, payment deadline
- Webhook: `payment.captured`

### 2.5 Rakuten Pay

- Direct API: complex, requires Rakuten's explicit merchant review; no npm package
- **Easiest path: KOMOJU** — `payment_details.type: "rakutenpay"`

### 2.6 KOMOJU — Recommended Single Aggregator

KOMOJU (owned by Degica, Tokyo) is the strongest single-API path for non-Japan-incorporated businesses.

**Why KOMOJU:**
- Foreign companies can sign up — this is their key differentiator
- English support throughout
- Single REST API covers: PayPay, konbini (Seven-Eleven + more), bank transfer, Rakuten Pay, Merpay, au PAY, Paidy (BNPL), credit cards, prepaid cards, 30+ international methods
- No npm package — REST calls only (`https://komoju.com/api/v1`)
- Auth: HTTP Basic with secret key as username, no password: `Authorization: Basic base64(sk_live_KEY:)`

**Webhooks:**
- `X-Komoju-Signature`: HMAC-SHA256 of raw body using webhook secret
- Events: `payment.authorized`, `payment.captured`, `payment.expired`, `payment.refunded`, `payment.failed`
- Retry: up to 25 times (exponential backoff, ~25 days to final)

### 2.7 Stripe Japan — Complete Supported Methods

For a Japan Stripe account:

| Method | Fee | Notes |
|--------|-----|-------|
| Cards (Visa/MC/Amex/JCB) | 3.6% | Standard |
| PayPay | 3.98% | No Connect, no recurring, auto-capture only |
| Konbini | 3.6% + min ¥120 | 4 chains (not Seven-Eleven); ~30 day activation |
| Furikomi (bank transfer) | 1.5% | Requires Customer object |
| Apple Pay / Google Pay | Card rate | |

### 2.8 Multi-Currency Display

Current: `Tenant.currency` (ISO 4217, lowercase), `Order.total` (integer minor units).

**JPY is a zero-decimal currency.** ¥5,000 is stored as 5000, not 500000. Current code divides by 100 for display — this breaks for JPY. Need a `isZeroDecimalCurrency(currency: string)` guard in the display formatter.

Required currencies for Jazy's House Tokyo: ¥ JPY (primary), £ GBP, $ USD, € EUR, CFA Franc (XOF).

---

## Part 3 — Japan Shipping Carrier APIs

### 3.1 Yamato Transport (Kuroneko) B2 Cloud API

**Status:** Enterprise-only, contractor-only, ~3 month onboarding. **Do not plan direct integration for JH-011.**

**Product names:**
- Legacy desktop: B2 Web Service (discontinued in favor of B2 Cloud)
- Current cloud: B2 Cloud — API layer: **B2 Cloud API** (launched June 12, 2024)
- C2C/marketplace: Delivery Linkage API (separate product)

**Authentication:** Proprietary API Access Authentication Key
- Obtained from Yamato Business Members portal (admin-level user only)
- Usable the day after issuance
- Also requires Billing Customer Code + Freight Management Number

**Endpoint URL:** Not publicly disclosed — gated behind Yamato Business Members login.

**No sandbox.** Official FAQ states: "テスト用のAPIアクセス認証キーはございません" (no test API keys). Dev environment is contractually provisioned (~3 months from application).

**Available operations (B2 Cloud API):**
- Shipping label generation (PDF, up to 1,000/batch)
- Screen-on (operator verification) and Screen-off (headless) modes
- No native rate calculation; no address validation

**No official npm package exists.**

**Foreign business:** Japan corporate entity required for direct access.

**Exception — Yamato USA Y-Ship Cloud:** Separate free service for US-based sellers shipping to Japan (REST-based, supports label generation + tracking, no Japan entity needed for US operations). Portal: `ys.yamatoamerica.com`

**Tracking numbers:**
- Standard: 12 digits (e.g., `123456789012`; displayed with hyphens `1234-5678-9012`)
- Multi-parcel: 11 digits
- Tracking: POST-based (no clean GET deep-link). Use Ship&co's tracking API instead.

### 3.2 Sagawa Express

**Status:** Contractor-only; e飛伝II discontinued March 31, 2024. Direct integration not recommended for JH-011.

**Current API products:**
- **Smart API (スマートAPI):** EC tracking + delivery rescheduling REST API
- **Label Issuance API (送り状発行API):** Label generation via "APIオプション" add-on
- **e飛伝III:** Browser-based label printing (not a REST API for developers)

**Authentication:** API key; requires Sagawa corporate account + Smart Club for Business + physical driver visit (~1-2 weeks). Japan address effectively required.

**No official npm package.** Third-party options: `xto` npm (multi-carrier tracker).

**Tracking numbers:** 10-12 digits domestic (`123456789012`); international: `RJ` + 10 digits
- Tracking deep-link: `https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=TRACKING_NUMBER`

### 3.3 Japan Post (日本郵便)

**Status:** No public developer REST API for tracking or label creation.

**What Japan Post actually provides:**
1. **Postal Code/Digital Address API** — the only self-serve free API (address lookup, NOT shipping)
   - Endpoint: `https://api.da.pf.japanpost.jp/api/v1/`
   - Auth: Non-standard OAuth 2.0 — uses `secret_key` (not `client_secret`), JSON body (not form-encoded), 600-second JWT tokens, requires `X-Forwarded-For` header
   - Static IP required for production — serverless rotating IPs (Vercel Edge) will fail
   - Corporations/sole proprietors only; requires ゆうID account
   - `client_secret` shown only once at registration
   - npm: `japanpost-api` (TypeScript) — wraps this OAuth2 API
2. **Shipping Label API** — application + Japan Post approval required (~1 week); auth key issued by Japan Post
3. **WMS Web API** — for contracted fulfillment center customers; HTTPS, session-based auth
4. **Tracking data provision** — EDI/batch CSV; apply at a post office; NOT real-time REST

**Tracking:** No public REST tracking API. Tracking site returns HTML. Unofficial GET endpoint exists (`?searchKind=S002&reqCodeNo1=NUMBER&locale=en`) but returns HTML.

**SAL (Surface Air Lifted): SUSPENDED.** Do not implement.

**Tracking number formats:**
- International: 2 letters + 9 digits + `JP` (e.g., `EE123456789JP` for EMS)
- Domestic Yu-Pack: 12 digits
- Tracking deep-link: `https://trackings.post.japanpost.jp/services/srv/search/direct?searchKind=S002&locale=en&reqCodeNo1=NUMBER`

**npm packages (address lookup only, not shipping):**
- `japanpost-api` — wraps OAuth2 Digital Address API
- `japan-postal-code` — offline address lookup from postal code (bundled dataset, no auth needed)

### 3.4 Ship&co — Recommended Shipping Aggregator

**The only confirmed English-language API covering all three Japan domestic carriers for label creation + tracking.**

- API base: `https://api.shipandco.com/v1/`
- Auth: `x-access-token: YOUR_TOKEN` header
- Docs: `https://developer.shipandco.com/en/`
- 30-day free trial; test mode available (no carrier credentials needed for test labels)

**Supported Japan carriers:**
- Yamato: `yamato_regular`, `yamato_nekopos`, `yamato_collect`, time-specified, etc.
- Sagawa: domestic variants
- Japan Post domestic: `yuupack_regular`, `yuupacket_regular`, `yuumail_regular`
- Japan Post international: `japanpost_ems`, `japanpost_air_packet`, `japanpost_smallpacket_air/sea`, etc.

**Key endpoints:**
- `POST /v1/shipments` — create shipment, returns label PDF URL + tracking number
- `POST /v1/rates` — multi-carrier rate comparison
- `GET /v1/tracking/:carrier/:trackingNumber` — unified tracking
- `POST /v1/carriers` — register carrier accounts

**Rate limiting:** `X-Api-Call-Limit` + `X-Api-Call-Reset` headers; 429 on excess.

**Japan Post caveat:** Domestic Japan Post services via Ship&co require a `user_id` from Japan Post (5-8 business day approval). Yamato/Sagawa in test mode work immediately.

### 3.5 Aggregator Comparison

| Aggregator | Yamato | Sagawa | Japan Post | Label Creation | English API |
|------------|--------|--------|------------|----------------|-------------|
| **Ship&co** | YES | YES | YES | YES | YES |
| ShipEngine | YES | Unconfirmed | No | YES (Yamato only) | YES |
| Easyship | No (intl only) | No | No | No | YES |
| Shippo | No | No | No | No | YES |
| EasyPost | No | No | Tracking only | No | YES |
| AfterShip | Tracking | Tracking | Tracking | No | YES |
| TrackingMore | Tracking | Tracking | Tracking | No | YES |
| Ship24 | Tracking | Tracking | Tracking | No | YES |

**ShipBob confirmed: no Japan fulfillment center.** Their own Tokyo page states this explicitly.

### 3.6 Postal Code Lookup

For Japanese address auto-fill at checkout:

**ZipCloud (fastest integration):**
- `GET https://zipcloud.ibsnet.co.jp/api/search?zipcode=7830060`
- No auth required, free, returns JSON with kanji + kana address components
- Higher latency during peak; ~1 req/sec recommended

**`japan-postal-code` npm (offline, no network dependency):**
- `npm install japan-postal-code`
- Bundled dataset; returns prefecture, city, area in kanji + kana + English
- `@types/japan-postal-code` for TypeScript types

---

## Part 4 — Integration Complexity

### Payment

| Method | Complexity | Key Blocker | Est. Dev Time |
|--------|------------|-------------|---------------|
| PayPay via Stripe | Low | Need Japan Stripe account | 1-3 days |
| Konbini via Stripe | Low | ~30 day activation review | 30 days wait + 1 day |
| Furikomi via Stripe | Low | Need Japan Stripe account | 1-2 days |
| KOMOJU (full suite) | Medium | Merchant application | 1 week application + 3-5 days dev |
| PayPay direct API | High | Japan entity required | Not recommended |
| Rakuten direct | Very High | Rakuten approval required | Not recommended |

### Shipping

| Task | Complexity | Key Blocker | Est. Dev Time |
|------|------------|-------------|---------------|
| Ship&co label creation | Medium | Account + Japan Post user_id (5-8 days) | 1-2 weeks |
| Tracking via AfterShip | Low | API key signup | 1-2 days |
| Yamato direct B2 Cloud | Very High | ~3 month onboarding | Defer past JH-011 |
| Sagawa direct Smart API | High | Japan address + driver visit | Defer past JH-011 |
| Postal code lookup | Low | None | Half a day |

---

## Part 5 — Recommended API Strategy

### Payment Stack

**Option A — Stripe-First** (if Japan Stripe account obtainable):
- Add `payment_method_types`: `['paypay', 'konbini', 'customer_balance']`
- Same webhook infrastructure, same PaymentIntent API
- Gap: Seven-Eleven konbini not covered

**Option B — KOMOJU Supplement** (recommended regardless):
- KOMOJU handles: PayPay (for non-Japan Stripe), Seven-Eleven konbini, Merpay, au PAY, Rakuten Pay
- New: `/api/webhooks/komoju` endpoint + typed REST client wrapper (2-3 days to build)

**Recommended: Both.** Stripe for cards + Apple/Google Pay (existing). KOMOJU for Japan-specific methods. This avoids the 30-day Stripe konbini delay for Seven-Eleven while keeping Stripe as primary.

### Shipping Stack

**Short-term (JH-011):**
- Ship&co for all label generation + tracking
- Build `src/lib/shipping/shipandco.ts` abstraction layer
- Covers Yamato + Sagawa + Japan Post in one integration

**Long-term (post-JH-011):**
- Direct Yamato B2 Cloud API (after 3-month onboarding, if volume justifies)
- Direct Japan Post label API (after approval)
- Ship&co kept as fallback/multi-carrier

### Address/Postal Code

- ZipCloud for auto-fill: `GET https://zipcloud.ibsnet.co.jp/api/search?zipcode=XXXXXXX`
- OR `japan-postal-code` npm for offline reliability

---

## Part 6 — Schema Changes Required

### New Models

```prisma
// PAYMENTS
model PaymentMethod {
  id       String  @id @default(cuid())
  tenantId String
  provider String  // "stripe" | "komoju"
  type     String  // "card" | "paypay" | "konbini" | "bank_transfer" | "rakutenpay"
  enabled  Boolean @default(false)
  @@unique([tenantId, provider, type])
}

// Add to Order:
// paymentProvider  String?  -- "stripe" | "komoju"
// paymentMethod    String?  -- "card" | "paypay" | "konbini" | etc.
// komojuPaymentId  String? @unique

// SHIPPING
model ShippingCarrier {
  id       String  @id @default(cuid())
  tenantId String
  name     String  // "Yamato" | "Sagawa" | "JapanPost"
  carrier  String  // Ship&co carrier code
  enabled  Boolean @default(false)
}

model OrderShipment {
  id               String         @id @default(cuid())
  orderId          String
  tenantId         String
  carrier          String         // "yamato" | "sagawa" | "japanpost"
  trackingNumber   String?
  trackingUrl      String?
  labelUrl         String?        // PDF URL from Ship&co
  shipandcoId      String?        @unique
  status           ShipmentStatus @default(LABEL_CREATED)
  shippedAt        DateTime?
  estimatedDelivery DateTime?
  createdAt        DateTime       @default(now())
  events           ShipmentEvent[]
}

enum ShipmentStatus {
  LABEL_CREATED
  PICKED_UP
  IN_TRANSIT
  OUT_FOR_DELIVERY
  DELIVERED
  RETURNED
  EXCEPTION
}

model ShipmentEvent {
  id         String   @id @default(cuid())
  shipmentId String
  status     String
  location   String?
  details    String?
  occurredAt DateTime
}

// COMMUNICATIONS
model OrderMessage {
  id         String   @id @default(cuid())
  orderId    String
  tenantId   String
  senderId   String?
  senderRole String?  // "admin" | "customer"
  content    String
  isPublic   Boolean  @default(true)  // false = admin-only internal note
  createdAt  DateTime @default(now())
}

model OrderStatusLog {
  id         String      @id @default(cuid())
  orderId    String
  tenantId   String
  fromStatus OrderStatus
  toStatus   OrderStatus
  changedBy  String      // user email
  reason     String?
  changedAt  DateTime    @default(now())
}

model SentEmail {
  id           String    @id @default(cuid())
  tenantId     String
  orderId      String?
  recipient    String
  subject      String
  templateType String    // "order_confirmation" | "shipping_notification" | etc.
  messageId    String?   // Resend message ID
  status       String    @default("queued")
  sentAt       DateTime?
  failureReason String?
  createdAt    DateTime  @default(now())
}

// PERMISSIONS
model UserPermission {
  id         String   @id @default(cuid())
  userId     String
  tenantId   String
  permission String   // "can_view_orders" | "can_edit_products" | "can_manage_shipping"
  grantedAt  DateTime @default(now())
  grantedBy  String
  @@unique([userId, tenantId, permission])
}

model ActivityLog {
  id         String   @id @default(cuid())
  userId     String
  tenantId   String
  action     String   // "order.status_changed" | "product.created" | etc.
  resourceId String?
  details    Json?
  timestamp  DateTime @default(now())
}
```

### Order Status Enum Extension (additive, backward compatible)

```prisma
enum OrderStatus {
  PENDING
  PROCESSING
  LABEL_CREATED  // NEW: label printed, not yet shipped
  SHIPPED
  IN_TRANSIT     // NEW: carrier has confirmed pickup
  DELIVERED
  CANCELLED
  REFUNDED       // NEW: payment refunded
}
```

---

## Part 7 — Gotchas & Watch Items

### Payment Gotchas
1. **LINE Pay Japan is dead.** Do not implement. Terminated April 30, 2025. Any task requesting LINE Pay Japan should be rejected.
2. **PayPay direct API blocks foreign merchants.** Use Stripe or KOMOJU instead.
3. **Stripe konbini misses Seven-Eleven.** Seven-Eleven is Japan's largest convenience store. Stripe's konbini does not include it. KOMOJU does.
4. **Furikomi on Stripe requires a Customer object.** PaymentIntent without `customer` field will error for bank transfer.
5. **Stripe konbini needs ~30 days activation.** Plan this early — it's a Dashboard review, not instant.
6. **JPY is zero-decimal.** `¥5,000` = `5000` stored, not `500000`. Current code divides by 100 for display — this BREAKS for JPY. Add a `isZeroDecimalCurrency()` guard.
7. **KOMOJU has no npm package.** Budget 2-3 days to build a typed `KomojuClient` wrapper.
8. **PayPay SDK maintenance limited.** `@paypayopa/paypayopa-sdk-node` has explicit "limited maintenance" warning. Consider REST calls directly or via KOMOJU/Stripe.

### Shipping Gotchas
1. **Yamato direct API: 3 months minimum.** No sandbox, no public endpoints, contractual onboarding. Use Ship&co for JH-011.
2. **Sagawa e飛伝II is discontinued.** Any references to it in docs/integrations are outdated as of March 31, 2024.
3. **Sagawa driver visit required.** Japan address needed for corporate account verification.
4. **SAL mail is suspended.** Do not implement Japan Post SAL shipping option — service currently unavailable.
5. **Japan Post has no public tracking REST API.** The tracking site returns HTML. All programmatic tracking goes through Ship&co or aggregators.
6. **Ship&co needs Japan Post user_id for domestic.** 5-8 business day approval. Not instant.
7. **Yamato tracking: no GET deep-link.** Yamato's system requires POST. Use Ship&co's unified tracking endpoint.
8. **Japan Post Digital Address API: non-standard OAuth.** Uses `secret_key` (not `client_secret`), JSON body (not form-encoded), requires `X-Forwarded-For`. Standard OAuth libraries won't work out of the box.
9. **Japan Post API: static IP required for production.** Vercel Edge / rotating IPs will fail. Need fixed egress (NAT gateway or proxy).

---

## Part 8 — Recommended Implementation Priority

### Phase A — Immediate (1-2 weeks)
1. **Order status audit log** (`OrderStatusLog`) — log every status change; foundational for all other features
2. **Resend email integration** — already planned in `.env.example`, not built; order confirmation emails unlock customer trust
3. **ZipCloud postal code lookup** — instant checkout UX improvement; zero friction to integrate
4. **JPY zero-decimal currency fix** — fix display formatter before any Japan payment goes live

### Phase B — Short-term (2-4 weeks)
5. **KOMOJU integration** — `/api/webhooks/komoju`, typed client, PayPay + konbini (Seven-Eleven) + bank transfer
6. **Ship&co integration** — label generation for at least Japan Post domestic (after user_id approval); return tracking number on order
7. **Order messages/notes** — `OrderMessage` model + admin UI (per-order thread + internal notes)

### Phase C — Medium-term (4-8 weeks)
8. **Full shipping workflow** — `ShipmentStatus` machine, tracking auto-sync via webhook, customer tracking page
9. **Stripe Japan payment methods** — PayPay + konbini (after ~30 day activation) + furikomi
10. **Granular employee permissions** — `UserPermission` model + admin UI for OWNER/ADMIN/EMPLOYEE differentiation
11. **Activity log** — `ActivityLog` model + middleware hooks on key mutations

---

## Sources

- GitHub: paypay/paypayopa-sdk-node (official, TypeScript)
- PayPay Developer FAQ (foreign company registration restrictions)
- Stripe Japan payment methods documentation (PayPay, konbini, furikomi)
- LY Corporation press release: LINE Pay Japan service termination
- KOMOJU API documentation and webhook docs (en.komoju.com)
- Yamato B2 Cloud API official page + press release (June 12, 2024)
- Yamato Business Members portal FAQ (sandbox, API keys)
- Ship&co API documentation (developer.shipandco.com/en)
- Ship&co blog: Japan Shipping API for Yamato/Sagawa/Japan Post
- Sagawa Smart API official page + e飛伝II discontinuation (lnews.jp)
- Japan Post Postal Code/Digital Address API portal + developer guide
- Japan Post OAuth non-standard implementation analysis (sakimura.org, June 2025)
- Japan Post tracking data provision service page
- Japan Post SAL service status page (currently suspended)
- Japan Post Hubez press release (March 2026, enterprise B2B label API)
- japanpost-api TypeScript client (seratch/japanpost-api-ts on GitHub)
- Japan carrier tracking URL gist (eggplants on GitHub)
- Easyship Japan couriers page (only DHL/FedEx/UPS confirmed)
- Shippo carrier list (no Japan domestic confirmed)
- EasyPost carrier directory (no Japan domestic label creation)
- ShipBob Tokyo page (no Japan fulfillment center confirmed)
- AfterShip, TrackingMore, Ship24 — Japan Post tracking documentation
- ZipCloud API documentation (zipcloud.ibsnet.co.jp)
- japan-postal-code npm package documentation
- Japan Post tracking number format guide (Ship24)
