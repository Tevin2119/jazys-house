# JH-011: Platform Expansion — Council Brief

## Context
Jazy's House Tokyo is an African fashion, superfoods, and catering e-commerce platform built on Next.js 15 + Prisma + Supabase + Stripe. It currently has: storefront, admin dashboard, order management (basic), analytics (PostHog+GA4+Clarity), query builder, metrics, user roles (6 levels).

**Location:** Tokyo, Japan — payment methods, shipping carriers, and logistics must be Japan-appropriate.

## Areas for Council Investigation

### 1. Payments — Japan Market
Current: Stripe only. Japan needs:
- PayPay (largest mobile payment in Japan)
- Line Pay
- Konbini (convenience store payment — 7-Eleven, Lawson, FamilyMart)
- Bank transfer (furikomi)
- Rakuten Pay
- Existing Stripe for credit cards + Apple Pay/Google Pay
- Multi-currency display: ¥ JPY primary, £ GBP, $ USD, € EUR, CFA Franc

### 2. Shipping & Order Fulfillment
- Shipping label generation (PDF)
- Carrier integration: Yamato (Kuroneko), Sagawa, Japan Post
- Tracking number + tracking URL per order
- Shipping status workflow: Pending → Processing → Label Created → Shipped → In Transit → Delivered
- Multiple carriers per tenant
- Shipping rate calculation by weight/size/destination (Japan domestic + international)
- Bulk label printing

### 3. Communications Center
- Per-order messaging thread (admin ↔ customer)
- Template messages (order confirmation, shipping notification, delivery)
- Email integration (Resend)
- Notification preferences per user
- Internal notes (admin-only, not visible to customer)
- Catering inquiry follow-up pipeline

### 4. Query Builder + Metrics Plugin System
- Saved queries from query builder can be pinned to metrics dashboard
- Custom chart types: line, bar, pie, number card, table
- Dashboard builder: drag-and-drop metric cards
- Filterable by date range, tenant, category
- Export: CSV, PDF
- Plugin architecture: allow custom metric plugins (JS/TS functions)

### 5. Employee Management
- Role-based access: OWNER, ADMIN, EMPLOYEE
- Per-employee permissions (can view orders, can edit products, can manage shipping, etc.)
- Activity log per employee
- Assigned tasks/tickets
- Shift/schedule (optional — for catering staff)

### 6. Order Orchestration
- Order status state machine (configurable per tenant)
- Automatic status transitions (payment confirmed → processing → label created → shipped)
- Manual overrides with audit trail
- Order flags: priority, fraud check, age (aging orders highlighted)
- Batch operations: bulk status change, bulk label printing
- Order notes timeline

### 7. Catering Operations
- Catering order lifecycle: Inquiry → Quoted → Confirmed → Prep → Out for Delivery → Completed
- Delivery route planning (simple — address + time window)
- Ingredient/inventory tracking
- Menu management per event type
- Dietary requirements tracking
- Staff assignment per event

### 8. UI/UX Design
- Claude Design to create HTML markup for ALL new features
- Japan-friendly UX: vertical text support, proper yen formatting
- Mobile-first admin operations (owner runs business from phone)
- Consistent with DC framework design system (Marcellus + Hanken Grotesk, terracotta palette, pill buttons)

## Council Seats & Tasks

### Seat 1 (Claude Code) — Research & Investigate
- Research Japan payment APIs (PayPay, Line Pay, Konbini)
- Research Japan shipping APIs (Yamato B2, Sagawa Web API, Japan Post)
- Evaluate existing npm packages / API wrappers
- Assess integration complexity for each
- Current system audit: what exists vs what's needed
- Write to .doa/council/JH-011/claude-investigation.md

### Seat 3 (Codex CLI) — Think & Analyze
- Architectural implications of multi-payment and multi-carrier
- Database schema changes needed
- Security considerations (payment data, shipping addresses in Japan)
- Performance at scale (10+ tenants, 1000+ orders)
- Write to .doa/council/JH-011/codex-think.md

### Seat 2 (OpenCode) — Validate
- Validate Claude's research — any missed APIs? wrong assumptions?
- Validate schema change proposals
- Tenancy implications of new features
- Write to .doa/council/JH-011/opencode-validate.md

### Seat 4 (Pi — Maker) — Synthesize
- 3-persona view: Dienaba (owner in Tokyo, manages from phone), Aminata (customer in Tokyo, expects Japanese UX), Tevin (dev/admin)
- What matters most to each persona?
- Write to .doa/council/JH-011/maker-synthesis.md

### Seat 5 (agy — Adversary) — Security
- Payment data handling (PCI implications)
- Japanese privacy law (APPI) considerations
- Shipping address data exposure
- Multi-carrier API key security
- Write to .doa/council/JH-011/adversary-audit.md

### Seat 6 (Pi — Archivist) — Pattern Check
- Cross-session patterns from JH-001 through JH-010
- Anti-patterns to avoid
- Final verdict + implementation priority
- Write to .doa/council/JH-011/archivist-verdict.md
