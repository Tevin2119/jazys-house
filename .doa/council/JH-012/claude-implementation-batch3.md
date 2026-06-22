Build is clean. Here's what was delivered in Batch 3:

---

## JH-012 Batch 3 — Done

**Build: ✅ zero errors — 3 new routes, 9 files created/rewritten**

### 3.1 Japanese Checkout (`checkout-form.tsx` + `checkout/actions.ts`)
- **Name**: 姓/名 + フリガナ (セイ/メイ, optional kana)
- **〒 Postal lookup**: "住所検索" button calls zipcloud API (free, no key) → auto-fills prefecture + city from 7-digit code
- **都道府県 dropdown**: all 47 prefectures from `i18n.ts`
- **Payment method selector**: 5 methods with icon/name/description — card (Stripe, active), PayPay/konbini/bank/Rakuten (「近日公開」 disabled)
- **Server action**: writes structured `{ postalCode, prefecture, city, line1, line2, country: 'JP' }` JSON + sets `paymentMethod`/`paymentProvider` on Order. Non-card orders land on `/checkout/confirmation?orderId=...` (existing page already handles it)

### 3.2 Order Tracking (`orders/[id]/page.tsx`)
- **6-step JP timeline**: 注文受付 → 処理中 → ラベル作成済 → 発送済み → 配達中 → 配達完了 — green past steps, primary current, muted future; banner for CANCELLED/REFUNDED
- **Tracking card**: carrier name (ヤマト/佐川/日本郵便) + tracking number + deep-link to carrier's tracking page
- **Japanese address display** via `formatJapaneseAddress()`, itemized billing (小計/送料/合計)
- **「この注文についてお問い合わせ」** → `/orders/[id]/messages`

### 3.3 Customer Messages (`orders/[id]/messages/`)
- Bubble thread (customer right/primary, store left/muted), `isInternal: false` filter
- Send form → `sendCustomerMessage` server action (bound args: orderId, tenantId, senderName; client only submits `content`); `revalidatePath` for instant refresh

### 3.4 Account Enhancements (`account/page.tsx`)
- Bilingual labels throughout (driven by `lang` cookie)
- Saved address from most recent order displayed in JP format
- **Language switcher** (日本語 / English): sets 1-year `lang` cookie via server action + `router.refresh()`
- Coming-soon placeholders for payment/notification preferences

### 3.5 i18n Library (`src/lib/i18n.ts`)
- `L(ja, en, lang?)` helper, `getLangFromHeader()`, `getLangFromCookies()`, `ORDER_STATUS_LABEL`, `TIMELINE_STATUSES`, `PREFECTURES` (47), `formatJapaneseAddress()`, `formatPriceLocalized()`

**Docs consulted:** CODING-STANDARDS.md, prisma/schema.prisma, gap-analysis.md (G-66–G-78), Batch 2 implementation notes.
い合わせ」** button → `/orders/[id]/messages`
- Nav + labels in Japanese

---

### 3.3 Customer Messages
**Files:** `src/app/(store)/orders/[id]/messages/page.tsx` (new) + `src/app/(store)/orders/[id]/messages/actions.ts` (new)

**Features:**
- Breadcrumb: マイアカウント / 注文履歴 / #ORDER / メッセージ
- Fetches only `isInternal: false` messages (customer sees public thread only)
- **Bubble thread**: customer messages right (primary bg) / store replies left (muted bg)
- Timestamp formatted in `ja-JP` locale
- **Send form**: textarea + 送信 button
- `sendCustomerMessage` server action: bound with `orderId`, `tenantId`, `senderName` server-side — client submits only `content`. Re-validates tenant ownership before writing. Calls `revalidatePath` for live refresh.

---

### 3.4 Customer Account Enhancements
**Files:** `src/app/(store)/account/page.tsx` (rewrite) + `src/app/(store)/account/actions.ts` (new) + `src/components/store/language-switcher.tsx` (new)

**Features:**
- All labels bilingual (JA/EN) based on active language
- **Saved address**: reads most recent order's structured address, renders via `formatJapaneseAddress()`
- **Language preference section**: 日本語 / English toggle buttons. Clicking calls `setLanguageCookie` server action (1-year cookie) + `router.refresh()` — page re-renders in chosen language
- **Payment preferences** placeholder (「近日公開予定」)
- **Notification preferences** placeholder (「近日公開予定」)

---

### 3.5 Language System
**File:** `src/lib/i18n.ts` (new)

**Exports:**
- `L(ja, en, lang?)` — pure bilingual picker, defaults to `'ja'`
- `getLangFromHeader(acceptLanguage)` — pure, parses Accept-Language header
- `getLangFromCookies(cookieStore)` — reads `lang` cookie from pre-resolved `ReadonlyRequestCookies`
- `ORDER_STATUS_LABEL` — dict for all 8 order statuses (JA + EN)
- `TIMELINE_STATUSES` — 6-element const tuple for delivery timeline order
- `PREFECTURES` — all 47 prefectures as const
- `formatJapaneseAddress(addr)` — formats structured address as 〒xxx 都道府県 市区町村 番地 建物
- `formatPriceLocalized(minorUnits, currency, lang)` — `Intl.NumberFormat` per locale (JPY no decimals)

---

## File Manifest

| File | Action |
|------|--------|
| `src/lib/i18n.ts` | Created |
| `src/components/store/checkout-form.tsx` | Rewritten |
| `src/app/(store)/checkout/actions.ts` | Rewritten |
| `src/app/(store)/orders/[id]/page.tsx` | Rewritten |
| `src/app/(store)/orders/[id]/messages/page.tsx` | Created |
| `src/app/(store)/orders/[id]/messages/actions.ts` | Created |
| `src/app/(store)/account/page.tsx` | Rewritten |
| `src/app/(store)/account/actions.ts` | Created |
| `src/components/store/language-switcher.tsx` | Created |

---

## Architecture Notes

- **zipcloud API**: called client-side from browser (no CORS issue). Returns `address1` (prefecture), `address2+3` (city+town). No API key required.
- **Non-Stripe checkout**: order created and stock decremented on "注文を確定する". `paymentProvider='KOMOJU'` stored on order. KOMOJU session wired in later task (G-69–G-71). Customer lands on confirmation page via `?orderId=` — existing path handles this.
- **Language cookie**: `lang=ja|en`, 1-year, `httpOnly: false` so future client-side i18n can read it. Server components read via `getLangFromCookies(await cookies())`.
- **No schema changes**: all new pages use models added in Batch 1 (`OrderMessage`, `Shipment`, `ShipmentEvent`, `Order.paymentMethod`, `Order.paymentProvider`).
- **Date serialisation**: server components format dates inline via `toLocaleString("ja-JP")` — no raw Dates passed to client.

## Docs Consulted
- `CODING-STANDARDS.md` — async patterns, server components, Prisma conventions
- `prisma/schema.prisma` — Order, OrderMessage, Shipment, ShipmentEvent models
- `src/lib/order-status.ts` — status ordering
- Batch 2 implementation notes — date serialisation and URL-state patterns
- `.doa/council/JH-012/gap-analysis.md` — G-66 through G-78 spec
