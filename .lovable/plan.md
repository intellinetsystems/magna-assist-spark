# Enhance AI Assistant: OEM Offers + Bulk Upload + Multi-Part Voice Orders

Extends the existing chat/voice assistant with three new capability groups, all rendered inline in the chat (no navigation away). This is a UI/mock-data implementation — no backend, real ML, or actual file ingestion — matching the existing assistant pattern (regex intents + demo data).

## Scope

### 1. OEM Discount Offers Assistant
- New intents in `Assistant.tsx`: `active offers`, `current campaigns`, `discounts available`, `offers on part …`, `offers for model …`, `check offers on my cart`, `how much can I save`, `expiring campaigns`, `recommend promotions`.
- New quick-action chips on the assistant home: 🎯 Active Offers, 💰 Cart Savings, 🚗 Model Offers, 📦 Part Offers, ⏰ Expiring.
- New `CampaignCard` (in `GuidedCards.tsx`) showing name, type, discount %, eligible parts count, validity, est. savings, status badge (Active / Expiring Soon), with View Details / View Parts / Add to Cart actions.
- New `CartOfferAnalysisCard` listing qualifying campaigns, total potential savings, and "add N more parts to unlock next slab" hint.
- Proactive recommendation banner injected after Part Search / Cart Update / Bulk Upload / Voice Order / Checkout flows.

### 2. Bulk Order Upload
- New quick action 📤 Bulk Order Upload (assistant home + quick-actions panel).
- New `BulkUploadCard` with: Download Template button (generates a real `.xlsx` client-side via `xlsx` lib with Sheet1 = Bulk Order Upload, Sheet2 = Instructions), Drag-and-drop + Browse + chat-attachment upload (xlsx/xls/csv).
- Client-side parse + mock validation (format, mandatory fields, qty, duplicates, invalid/obsolete, supersession, eligibility) → `UploadSummaryCard` (total / valid / invalid / superseded + Review Errors, Download Validation Report, Add Valid to Cart).
- Follow-up AI Insights card (campaign eligibility, supersessions, volume incentive gap, est. savings, Apply Offers / Proceed).

### 3. Multi-Part Voice Ordering
- Extend voice/text intent parser to extract multiple `{partNumber|description, qty}` tuples from one utterance using a regex + number-word map ("ten" → 10, "twenty five" → 25).
- New `VoiceOrderConfirmCard` listing parsed items in a table with Confirm / Modify / Remove per row / Cancel.
- Validation branches: invalid part → suggestion card with Search Similar / Retry; superseded part → swap prompt; duplicate consolidation card.
- `VoiceOrderSuccessCard` with totals + View Cart / Continue / Checkout.

### 4. Unified flows
- Scenario glue: after Voice add or Bulk upload, automatically chain into Campaign Recommendation card.
- `Review my cart` intent renders a `CartReviewCard` (parts, qty, applicable campaigns, savings, next-slab gap, expiring alerts).
- Proactive alerts (campaign expiring, volume incentive, supersession, stock optimization) surfaced as `AlertCard` variants when relevant flows complete.

## Files

New:
- `src/lib/offers-data.ts` — mock campaigns, eligible parts, cart, supersession map, number-word map, parser util `parseVoiceOrder(text)`, `validateBulkRows(rows)`, `analyzeCart(items)`.
- `src/components/assistant/OffersCards.tsx` — `CampaignCard`, `CartOfferAnalysisCard`, `RecommendationBanner`, `AlertCard`, `CartReviewCard`.
- `src/components/assistant/BulkUploadCard.tsx` — template download (xlsx), drop zone, parse, `UploadSummaryCard`, `BulkInsightsCard`.
- `src/components/assistant/VoiceOrderCards.tsx` — `VoiceOrderConfirmCard`, `VoiceOrderSuccessCard`, `SupersededPartPrompt`, `DuplicateConsolidationCard`, `InvalidPartCard`.

Edited:
- `src/components/assistant/Assistant.tsx` — register new intents, add quick-action chips, wire scenario chaining (voice → offers, bulk → insights → offers).
- `src/components/assistant/QuickActionsButton.tsx` (or equivalent quick-actions surface) — add new actions.
- `package.json` — add `xlsx` for template + parsing.

## Technical notes

- Pure frontend / presentation: all "validation", "savings", and "supersession" data lives in `offers-data.ts` mocks.
- Reuse existing `BotShell`, design tokens, pink Mahindra theme, and `FeedbackActions`. No new color tokens unless needed for badge variants (Active = emerald, Expiring = amber, Invalid = rose) — reuse existing.
- Voice parser is a string parser fed by both typed text and the existing voice transcript path; no STT changes.
- Template download uses `xlsx` (`writeFile`) entirely client-side; uploaded files parsed in-browser, never sent anywhere.
- Currency shown as ₹ to match the spec.
- No router/route changes, no backend, no Lovable Cloud, no schema changes.

## Out of scope

- Real campaign engine, real OMS/cart persistence, real supersession DB, real validation service, real STT improvements, server endpoints, auth.
