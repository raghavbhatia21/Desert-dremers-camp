# Product Requirements Document (PRD)
## Royal Resort — Website & Firebase Booking Engine

**Version:** 1.0
**Date:** July 5, 2026
**Owner:** Raghav (Product/Engineering)
**Status:** Draft for review

---

## 1. Overview

A luxury/royal-themed resort website with an integrated real-time booking engine, built on Firebase (Auth, Firestore/Realtime DB, Hosting/Functions) and a fast vanilla-JS or lightweight frontend. The site must be secure by default, fully responsive, visually "royal" (heritage-luxury aesthetic), and aggressively optimized for three discovery channels:

- **SEO** (Google/Bing organic ranking)
- **GEO** (Generative Engine Optimization — visibility inside AI Overviews / Google SGE)
- **AEO** (Answer Engine Optimization — being cited/recommended by ChatGPT, Claude, Gemini, Perplexity)

Given your experience hardening DesignE (fixing XSS via `innerHTML`, hardcoded Firebase credentials, CORS/Referer spoofing, unauthenticated session writes), this PRD bakes those lessons in as non-negotiable requirements rather than after-the-fact fixes.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Convert visitors to bookings | Booking conversion rate | ≥ 3–5% of unique visitors |
| Rank organically | Top 3 Google position for "[resort name] + city" and 5–10 category keywords | Within 4–6 months |
| Be cited by AI assistants | Appears in ChatGPT/Gemini/Claude/Perplexity answers for "best resort in [location]" style queries | Verified monthly via test prompts |
| Zero critical security incidents | Vulnerabilities found in pen-test/audit | 0 critical, 0 high before launch |
| Performance | Core Web Vitals (LCP, INP, CLS) | All "Good" in PageSpeed Insights |
| Mobile usability | Mobile-first responsive score | 100% pass on Google Mobile-Friendly Test |

---

## 3. Users & Personas

1. **Guest / Visitor** — browsing rooms, checking availability, booking, paying, receiving confirmation.
2. **Returning Guest** — logs in (optional guest account) to view/modify/cancel bookings.
3. **Resort Admin/Owner** — manages rooms, rates, availability calendar, bookings, guest messages, content (via Firebase Auth–gated admin dashboard).
4. **Staff/Front Desk** (optional, phase 2) — limited role to view/check-in bookings.
5. **Search & AI Crawlers** — Googlebot, Bingbot, GPTBot, ClaudeBot, Google-Extended, PerplexityBot — must be able to parse structured, accurate content.

---

## 4. Scope

### 4.1 In Scope (Phase 1 — MVP)
- Public marketing website (Home, Rooms/Suites, Amenities, Gallery, Dining, Offers, Location/Contact, FAQ, Blog/Journal)
- Real-time booking engine (search availability → select room → guest details → payment → confirmation)
- Firebase Auth–secured Admin Dashboard (rooms, pricing, availability, bookings, content edits)
- Automated email confirmations (booking + cancellation)
- SEO/GEO/AEO technical foundation
- Security hardening (see Section 7)

### 4.2 Phase 2 (Post-launch)
- Loyalty/membership guest accounts
- Multi-language site (i18n) for GEO in regional markets
- Staff role with limited permissions
- Reviews/testimonials integration (with schema markup)
- WhatsApp/SMS booking confirmations
- Dynamic pricing engine (seasonal/event-based)

### 4.3 Out of Scope (for now)
- Native mobile apps
- Channel-manager integration with OTAs (Booking.com, MakeMyTrip, Agoda) — flagged as a future integration point

---

## 5. Functional Requirements

### 5.1 Public Website
- **Home**: hero video/image, value proposition, quick-search booking widget, highlights, social proof.
- **Rooms & Suites**: gallery, amenities, pricing, real-time availability, "Book Now" CTA per room.
- **Booking Flow**:
  1. Select check-in/check-out dates, guests, room type.
  2. Live availability check against Firestore (no double-booking).
  3. Guest details form (name, email, phone, special requests).
  4. Payment (Razorpay/Stripe — see Section 8).
  5. Confirmation page + email + Firestore booking record with unique booking ID.
- **Cancellation/Modification**: guest can view booking status via a secure link (signed token) or logged-in account.
- **Content pages**: Dining, Spa/Amenities, Events/Weddings, Offers, Location & Contact (embedded map), FAQ, Blog.
- **Contact/Enquiry form** with spam protection (reCAPTCHA v3 or Firebase App Check).
- **Blog ("The Journal")** and **programmatic SEO landing pages** (occasion/amenity/location/season targeted) — see Section 9.1–9.2 for full spec. Both are content-managed via Firestore so new pages don't require a redeploy.

### 5.2 Admin Dashboard (Firebase Auth-gated)
- Login via Firebase Authentication (email/password + optional 2FA via TOTP or phone OTP for admin).
- Role-based access control (Admin vs Staff) via Firebase custom claims — **never trust client-side role flags**.
- Manage: room types, pricing/seasonal rates, availability blocks, bookings (view/confirm/cancel), site content (offers, gallery, blog posts, programmatic SEO page definitions in `seoPages`), enquiry inbox.
- Audit log of admin actions (who changed what, when) stored in Firestore.
- Session handling: short-lived ID tokens, forced re-auth for sensitive actions (rate changes, refunds).

### 5.3 Notifications
- Automated booking confirmation & cancellation emails (Firebase Extensions / Trigger Email, or a transactional email API like Resend/SendGrid).
- Optional SMS/WhatsApp confirmation (Phase 2).

---

## 6. Design Requirements — "Royal" Theme, Smooth & Responsive

- **Visual language**: deep jewel tones (maroon, emerald, navy) with gold/brass accents, serif display typography paired with a clean sans-serif for body text, generous whitespace, subtle textures (marble, damask patterns used sparingly).
- **Motion**: smooth scroll-triggered fade/parallax reveals, micro-interactions on buttons/cards, page transitions under 300ms perceived delay — motion must not block interactivity or hurt Core Web Vitals (respect `prefers-reduced-motion`).
- **Responsiveness**: mobile-first, tested at 360px, 768px, 1024px, 1440px+ breakpoints; booking widget must be fully usable on mobile (large tap targets, native date pickers where sensible).
- **Imagery**: high-quality, compressed/responsive images (WebP/AVIF with fallback), lazy-loaded below the fold.
- **Accessibility**: WCAG 2.1 AA — proper contrast ratios, alt text, keyboard navigation, ARIA labels on interactive booking components (this also helps AEO, since AI crawlers parse semantic/accessible HTML well).

---

## 7. Security Requirements (Zero-Tolerance Checklist)

Directly informed by prior audit findings on your other projects — treat every item below as a launch blocker, not a nice-to-have.

### 7.1 Firebase-Specific
- [ ] **No hardcoded Firebase config secrets treated as sensitive** — the web config object is public by design, but security must come from **Firestore Security Rules**, not obscurity.
- [ ] Firestore Security Rules: guests can only read public/availability data and create their own booking document; only authenticated admin (via custom claims) can write rates/availability/content.
- [ ] **Firebase App Check** enabled and enforced (not left non-functional) on Firestore, Functions, and Auth to block abuse from non-app clients/bots.
- [ ] Firebase Auth: enforce strong password policy, email verification for admin accounts, rate-limit login attempts, enable 2FA for admin.
- [ ] Custom claims for roles (admin/staff) set only via a trusted Cloud Function — never settable from the client.
- [ ] No booking price/amount ever trusted from client input — final price always recalculated server-side (Cloud Function) before payment capture.

### 7.2 Web Application
- [ ] **No `innerHTML` with unsanitized user/API input** anywhere (booking forms, review widgets, admin content editor) — use safe DOM methods or a sanitizer (DOMPurify) if rich text is unavoidable.
- [ ] All forms validated both client-side (UX) and server-side (Cloud Function/security rules — source of truth).
- [ ] CSRF protection on any state-changing request; **no trust in `Referer` header alone** for origin checks — use proper CORS allow-lists + Firebase Auth tokens.
- [ ] HTTPS enforced everywhere (Firebase Hosting default) with HSTS header.
- [ ] Content Security Policy (CSP) header restricting script/style sources; disallow inline scripts where possible.
- [ ] Session/token handling: short-lived Firebase ID tokens, refresh via SDK, no tokens in URL query strings or localStorage exposed to XSS.
- [ ] Rate limiting on booking creation, contact form, and login endpoints (Cloud Functions + Firebase App Check + optional Cloud Armor) to block scraping/spam/booking-flood attacks.
- [ ] Dependency hygiene: lockfile committed, automated `npm audit` / Dependabot-style scanning in CI.
- [ ] No sensitive admin routes indexable — `noindex` + auth-gated + not linked from public sitemap.
- [ ] Payment handled via PCI-DSS compliant provider (Razorpay/Stripe Checkout) — **card data never touches your own servers/Firestore**.
- [ ] Pre-launch: run an automated scan (OWASP ZAP) + manual review of the exact issue classes found in your past audits (XSS, CORS bypass, session tampering, exposed debug endpoints) before go-live, and again before any major release.

---

## 8. Technical Architecture

| Layer | Choice | Notes |
|---|---|---|
| Hosting | Firebase Hosting (or Netlify, per your existing workflow) | CDN + SSL out of the box |
| Frontend | Vanilla JS / lightweight framework | Consistent with your DesignE stack; prioritize fast load over heavy frameworks |
| Auth | Firebase Authentication | Admin/staff only; guests can book without forced account creation (guest checkout) |
| Database | Firestore (preferred over Realtime DB for this use case) | Better querying for availability, indexes, and security rules granularity |
| Serverless logic | Cloud Functions | Price recalculation, availability locking (transactions to prevent double-booking), email triggers, role assignment |
| Payments | Razorpay (India) / Stripe (international) | Hosted checkout, PCI compliance offloaded |
| Email | Firebase Trigger Email extension or Resend/SendGrid | Transactional confirmations |
| Bot/abuse protection | Firebase App Check + reCAPTCHA v3 | On booking + contact forms |
| Monitoring | Firebase Crashlytics/Performance + Google Search Console + Uptime monitor | Post-launch observability |

**Double-booking prevention**: use a Firestore transaction that checks and locks the date-range/room availability atomically when a booking is created — this is the most common correctness bug in booking engines and must be explicitly tested with concurrent-request test cases.

---

## 9. SEO Requirements

- **Technical SEO**: clean semantic HTML5, single canonical URL per page, XML sitemap auto-generated and submitted to Google Search Console & Bing Webmaster Tools, `robots.txt` correctly configured, HTTPS, mobile-first indexing readiness, fast Core Web Vitals (target LCP < 2.5s, INP < 200ms, CLS < 0.1).
- **On-page SEO**: unique title tags & meta descriptions per page, keyword-mapped H1–H3 structure, descriptive image alt text, internal linking between rooms/amenities/blog.
- **Local SEO**: Google Business Profile fully optimized and linked, NAP (Name/Address/Phone) consistency across site and directories, embedded Google Map, local landmarks/keywords in content.
- **Structured Data (Schema.org)**: `Hotel` / `Resort` / `LodgingBusiness` schema, `Room`/`Offer` schema with pricing, `FAQPage` schema, `BreadcrumbList`, `Review`/`AggregateRating` schema (once reviews exist), `Event` schema for weddings/functions.
- **Backlinks/authority**: listings on travel directories (TripAdvisor, Google, regional tourism boards) linking back.

### 9.1 Content Strategy: Blog ("The Journal")

A hand-curated blog for editorial, trust-building, and long-tail content that's hard to templatize:

- **Sections**: Guest stories, local guides ("Things to do near [location]"), event/wedding features, seasonal offers, behind-the-scenes (chef, spa, sustainability).
- **Cadence**: 2–4 posts/month minimum — freshness is a ranking and GEO trust signal (Section 10).
- **Each post**: unique title/meta, `Article`/`BlogPosting` schema, internal links to relevant room/amenity pages, and an FAQ block near the end for AEO capture.
- **Data model**: stored in Firestore (`blogPosts` collection: title, slug, body, coverImage, tags, publishedAt, author) so the admin dashboard can create/edit posts without a redeploy — same pattern as your rooms/offers content.

### 9.2 Programmatic SEO: Auto-Generated Landing Pages (recommended addition)

This is the higher-leverage piece: instead of writing one page per keyword, generate a *page template* that produces a real, indexable, unique page for every meaningful keyword combination — a technique used heavily by hotel/booking sites (Airbnb, Booking.com) to rank for thousands of long-tail queries at once.

**How it works:**
1. Define keyword "axes" relevant to a resort, e.g.:
   - **Occasion**: honeymoon, family vacation, weekend getaway, corporate offsite, destination wedding, solo travel
   - **Amenity/theme**: pool villa, spa retreat, pet-friendly, mountain view, lakeside
   - **Nearby landmark/city**: each real nearby town, airport, or attraction
   - **Season/event**: New Year, monsoon getaway, summer retreat
2. Combine axes into real, useful pages — not spammy duplicates — e.g. `/honeymoon-resort-near-[city]`, `/family-friendly-resort-with-pool-villas`, `/corporate-offsite-venue-near-[airport]`.
3. Each generated page pulls **real data** (actual rooms, actual photos, actual pricing, actual distance/directions) from Firestore and combines it with a **unique intro paragraph** — never just swap the keyword into an identical template, since Google explicitly penalizes "doorway pages" with near-duplicate thin content.
4. Store the axis/keyword definitions in a `seoPages` Firestore collection (keyword, template type, target intent, linked rooms/amenities, custom intro copy) so the admin can add new target pages without a developer.
5. Auto-generate: sitemap entries, meta title/description, `LodgingBusiness`/`FAQPage` schema, and internal links back to the core Rooms/Offers pages — all templated from the same `seoPages` data.
6. **Quality gate**: each auto-generated page needs at least one paragraph of genuinely unique, useful copy (not spun/duplicated) plus real supporting data (map distance, specific amenities) before it's allowed to publish — this is what separates legitimate programmatic SEO from a penalty-risk doorway page.

**Why this is better than blog-only for this use case:** a blog needs ongoing manual writing to cover each keyword; a programmatic page system covers the full combinatorial keyword space (occasion × amenity × location × season) from data you already maintain in the admin dashboard, scales indefinitely, and doubles as GEO/AEO fuel since each page is a clean, factual, schema-rich answer block AI engines can cite directly.

**Guardrail:** cap initial launch at a curated set of ~20–40 high-intent pages (not thousands at once) to avoid a thin-content penalty on a new domain, then expand based on Search Console query data showing what people are actually searching for.

---

## 10. GEO (Generative Engine Optimization) Requirements

GEO targets visibility inside AI-generated answers (Google AI Overviews/SGE, Perplexity, etc.) — it overlaps with SEO but rewards different signals:

- **Answer-shaped content**: write clear, self-contained paragraphs that directly answer likely questions ("What is the best time to visit [resort]?", "Does [resort] have a spa?") near the top of relevant pages — AI summarizers favor extractable, unambiguous statements over marketing fluff.
- **Structured data first**: schema markup (Section 9) is even more important for GEO than classic SEO, since generative engines parse structured data heavily to build accurate summaries.
- **E-E-A-T signals**: visible authorship/ownership info, real photos (not stock), verifiable address/contact, press mentions, and reviews — generative engines weight trust signals heavily before citing a source.
- **Freshness**: regularly updated offers/blog content signals an actively maintained, trustworthy source.
- **Third-party presence**: consistent, accurate listings on Wikipedia (if eligible), TripAdvisor, Google Maps, travel blogs — generative engines often cross-reference multiple sources rather than relying solely on your own site.

---

## 11. AEO (Answer Engine Optimization) Requirements — Being Recommended by ChatGPT, Claude, Gemini

AI assistants recommend businesses based on what they can find and verify across the web, not by "ranking" in the traditional sense. Concretely:

- **Allow AI crawlers**: ensure `robots.txt` explicitly permits `GPTBot`, `ClaudeBot`, `Google-Extended`, `PerplexityBot`, etc. (a resort wants to be found, so do not block these — unlike sites protecting content, this is a discoverability play).
- **Publish an `llms.txt`** at the site root summarizing what the resort is, key facts (location, room types, price range, amenities, policies) in plain, unambiguous language — an emerging convention some AI crawlers use to quickly understand a site.
- **FAQ-style content blocks** answering the exact questions travelers ask assistants ("Is [resort] good for families?", "Does [resort] have airport pickup?") — write the literal question as a heading followed by a direct 2–3 sentence answer.
- **Consistency across the web**: AI assistants often synthesize from review sites, travel articles, and directories — inconsistent facts (wrong price range, outdated amenities) across sources reduce the chance of being confidently recommended.
- **Get mentioned in "best of" articles and travel blogs** — LLMs are heavily influenced by third-party editorial content, not just your own site, so a light PR/outreach push to travel bloggers has outsized AEO value.
- **Monitor**: periodically query ChatGPT/Claude/Gemini/Perplexity with realistic prompts ("best luxury resort near [location]") and track whether/how the resort appears, then adjust content gaps accordingly.

---

## 12. Non-Functional Requirements

- **Performance**: Lighthouse score ≥ 90 across Performance/Accessibility/Best Practices/SEO.
- **Scalability**: Firestore + Cloud Functions scale automatically; load-test the booking transaction path for concurrent bookings during peak season launches/offers.
- **Reliability**: 99.9% uptime target (Firebase Hosting SLA); automated backups of Firestore data.
- **Maintainability**: modular vanilla JS (or component-based) codebase, documented Firestore schema and security rules, environment-based config (dev/staging/prod Firebase projects).
- **Compliance**: privacy policy, cookie consent (if using analytics), data retention policy for guest PII, PCI compliance via payment provider.

---

## 13. Milestones (Suggested)

| Phase | Deliverable | Duration |
|---|---|---|
| 1 | UX wireframes + royal design system | 1–2 weeks |
| 2 | Firebase architecture, security rules, Auth setup | 1 week |
| 3 | Core site build (pages, content, responsive design) | 2–3 weeks |
| 4 | Booking engine (availability, transactions, payments) | 2–3 weeks |
| 5 | Admin dashboard | 1–2 weeks |
| 6 | SEO/GEO/AEO implementation (schema, llms.txt, sitemap, blog, programmatic page templates + first 20–40 pages) | 1–2 weeks (parallel) |
| 7 | Security audit & pen-test, performance tuning | 1 week |
| 8 | Launch + Search Console/Business Profile submission | — |
| 9 | Post-launch monitoring, AI-visibility tracking, content iteration | Ongoing |

---

## 14. Open Questions

1. Guest checkout only, or also guest accounts with booking history?
2. Which payment gateway — Razorpay (domestic) only, or Stripe too for international guests?
3. Single property or multi-property (white-label style, similar to DesignE's model) from day one?
4. Is a channel-manager/OTA integration (Booking.com, MakeMyTrip) needed at launch or Phase 2?
5. Budget/timeline constraints that would change the tech choices above (e.g., Netlify vs Firebase Hosting)?

---

*End of PRD v1.0*
