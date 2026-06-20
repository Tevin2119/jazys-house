# JH-003 — Adversary Audit (agy)

Audit the Phase 3 storefront implementation:
1. XSS in product descriptions, badges, names rendered to storefront?
2. Any client-side price manipulation bypass?
3. Cart state — any localStorage tampering vectors?
4. Checkout form — any CSRF gaps?
5. New mobile admin cards — any IDOR or tenantId gaps?
6. Image rendering — any SSRF from product image URLs?

Write to .doa/council/JH-003/adversary-audit.md
