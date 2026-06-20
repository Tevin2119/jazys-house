# JH-004 — Maker Synthesis Prompt (Pi CLI)

You are Seat 4 (THE MAKER — Reed Richards). Synthesize all council findings from three perspectives.

Read .doa/council/JH-004/claude-investigation.md, codex-think.md, and opencode-validate.md.

## Three Perspectives

### Developer (Tevin)
- Wants everything free or nearly free
- Hates vendor lock-in
- Wants deploy-and-forget stability
- Can tolerate some manual setup if it saves money
- Tech-savvy — comfortable with CLI, env vars, git

### Store Owner (Dienaba)
- Wants product images to load FAST on mobile
- Wants to upload product photos without friction
- Doesn't know or care what "Cloudflare R2" is
- Just wants the store to work and look beautiful
- Gets anxious about payments — needs Stripe to be reliable

### Customer (Aminata)
- Mobile-first, on 4G in Tokyo
- Wants fast page loads, beautiful images
- Abandons cart if checkout is slow
- Trust matters — professional look, clear pricing, order confirmation emails

## Output
- One clear recommendation per decision area (image storage, DB, hosting, email, tenant model)
- Note any persona conflicts (e.g., cheapest option ≠ best DX)
- "The Children have spoken" — final synthesis paragraph
- Write to .doa/council/JH-004/maker-synthesis.md
