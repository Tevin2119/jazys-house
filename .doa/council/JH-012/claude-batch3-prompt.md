# JH-012 Batch 3 — Customer Pages + Japanese Checkout

Read .doa/council/JH-012/gap-analysis.md Section 11-12.

## 3.1 Japanese Checkout Enhancement
File: src/app/(store)/checkout/page.tsx + checkout-form.tsx + actions.ts
- Postal code input (〒) with "住所検索" auto-lookup button (use zipcloud API — free, no key needed)
- Prefecture dropdown (都道府県): all 47 prefectures
- City/Ward auto-filled from postal lookup
- Address line 1 (町名・番地) + line 2 (建物名・部屋番号)
- Name: Last (姓) + First (名) with Kana fields (セイ / メイ)
- Phone field (already added in Batch 1b)
- Payment method selector UI: credit card, PayPay, konbini, bank transfer, Rakuten Pay
- Each method: icon + name + description
- Store selected payment method in Order.paymentMethod

## 3.2 Order Tracking (customer)
File: src/app/(store)/orders/[id]/page.tsx
- Japanese status timeline: 注文受付 → 処理中 → ラベル作成済 → 発送済み → 配達中 → 配達完了
- Visual steps with icons
- Tracking number + carrier link (when available)
- Estimated delivery date
- Items list with thumbnails
- "Contact about this order" button → message thread

## 3.3 Customer Messages
File: src/app/(store)/orders/[id]/messages/page.tsx (or inline on tracking page)
- Message thread (customer ↔ store)
- Customer sees only public messages (isInternal=false)
- Input + send button

## 3.4 Customer Account Enhancements
File: src/app/(store)/account/page.tsx
- Saved addresses (Japanese format)
- Default payment method preference
- Language preference: 日本語 / English
- Notification preferences

## 3.5 Language System
Create src/lib/i18n.ts:
- Dictionary: JA + EN for all status labels, nav items, common UI
- L() helper function
- Language stored in user session/cookie
- Auto-detect from browser Accept-Language header
- Currency display format per locale

## RULES
- Read existing code before editing
- Match the template's Japanese UX patterns
- Run npm run build after changes
- Write summary to .doa/council/JH-012/claude-implementation-batch3.md
