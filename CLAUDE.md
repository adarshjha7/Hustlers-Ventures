# Hustlers Ventures — Investor Portal

Hustlers Ventures transforms unorganized sectors into institutional-grade assets, allowing investors to co-own high-yield real-world businesses. The platform covers four asset verticals:

- **Intercity Transportation (Fleet)** — intercity bus pools (Pool 6, etc.)
- **Hospitality** — Zostel franchise locations (e.g., Varanasi)
- **Highway F&B** — highway restaurant outlets (e.g., Jadcherla)
- **Debt Funds** — structured fixed-income instruments backed by operational business assets

This repo is the full-stack web platform: public marketing site + OTP-gated opportunity pages + secure investor dashboard + admin console. Deployed on **Vercel**.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, React Compiler enabled)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 (utility-first, inline styles where needed)
- **Database / Auth**: Supabase (PostgreSQL, RLS, Auth, real-time WebSocket)
- **Supabase client**: `@supabase/ssr` — `createBrowserClient` on client, `createServerClient` on server
- **PDF generation**: jsPDF + jspdf-autotable (client-side)
- **Charts**: Recharts
- **Email**: Nodemailer + Gmail SMTP (server-side only) — all transactional emails go through `src/lib/mailer.ts`
- **Icons**: lucide-react

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, forgot password, reset password — public
│   ├── (dashboard)/         # Protected investor dashboard
│   │   ├── layout.tsx       # Sidebar nav (dark), white top header, session timeout (30-min inactivity), auth guard
│   │   └── dashboard/
│   │       ├── page.tsx         # Overview: hero (capital deployed, milestone badges, earned chips, PDF download),
│   │       │                    #   debt fund cross-sell card (light cyan; only when totalLifetimeReturns > 0),
│   │       │                    #   explore opportunities, portfolio mix donut (2+ sectors),
│   │       │                    #   asset breakdown cards, payout trajectory + historical performance + capital timeline chart
│   │       ├── error.tsx        # Dashboard-level error boundary
│   │       ├── insights/
│   │       │   └── page.tsx     # Compound Growth Simulator (line chart, 1Y/3Y/5Y/10Y), Payout Consistency
│   │       │                    #   (std dev volatility per asset), Reinvestment Behaviour (capital adds vs payouts),
│   │       │                    #   Investor Trends social proof, Referral Program Coming Soon card with one-click sign-up
│   │       ├── portfolio/
│   │       │   ├── page.tsx     # Server redirect → /dashboard (portfolio merged into overview)
│   │       │   └── [id]/page.tsx # Individual asset detail
│   │       ├── documents/page.tsx  # Documents Vault — Asset Statements (per asset PDF), Tax Summary (Tax Docs tab)
│   │       ├── notifications/page.tsx  # Payout alerts + broadcast announcements; marks all read on mount
│   │       ├── opportunities/page.tsx  # Investment opportunities — active + coming_soon, thumbnail images, detail_url CTA
│   │       └── settings/page.tsx
│   ├── (marketing)/         # Public-facing pages (no auth required)
│   │   └── opportunities/
│   │       ├── page.tsx                    # DB-driven category listing (image + volatility from opportunity_categories)
│   │       ├── [categorySlug]/page.tsx     # Opportunity cards per category (active/coming_soon/closed)
│   │       │   └── [opportunitySlug]/page.tsx  # Generic DB-driven detail page (used when no static page exists)
│   │       ├── transportation/pool-6/      # Static detail page — Pool 6 fleet fund
│   │       ├── hospitality/varanasi-zostel/ # Static detail page — Zostel Varanasi
│   │       ├── fnb/jadcherla-restaurant/   # Static detail page — Jadcherla highway F&B
│   │       └── debt-funds/debt-fund-series-1/ # Static detail page — Debt Fund Series 1
│   ├── (auth)/
│   │   └── register/page.tsx  # Invite-token gated registration form — validates ?token= via /api/invite/verify before showing form; fields: name, phone (pre-filled), email, PAN, bank account, IFSC, associate (optional)
│   ├── (admin)/             # Admin console — guarded by ADMIN_EMAIL server-side
│   │   └── admin/
│   │       ├── page.tsx          # Admin overview — stat cards with period filter (All Time / This Year / This Quarter / This Month), analytics charts (Monthly Disbursements, Capital by Pool, Investor Growth), recent registrations, recent payouts, system logs
│   │       ├── AdminCharts.tsx   # Client component — Recharts charts for admin overview (receives pre-aggregated props from server page)
│   │       ├── applications/         # Investor application review — approve/reject, pending badge in nav, CSV export
│   │       ├── investors/            # Investor management — add, edit, delete, sortable table, CSV export
│   │       ├── investments/          # Investment management — sortable table, CSV export
│   │       ├── payouts/              # Payout management — linked to declarations, TDS tracking, CSV export; investor dashboard shows emergency fund accumulation card
│   │       ├── pools/                # Pool management — CRUD + investor summary view, CSV export
│   │       ├── declarations/         # ROI declarations per pool per quarter (quarter label, ROI %, finalized)
│   │       ├── opportunities/        # Opportunity CRUD — listing metadata only (no JSONB editors); detail pages are static files
│   │       ├── opportunity-categories/ # Category CRUD — name, slug, description, image_url (path), volatility_level, active toggle
│   │       ├── loans/                # Loan tracking — CRUD, type, status filter, CSV export, EMI schedule drawer
│   │       ├── referral-interest/    # Referral early access sign-ups — sortable table (name, email, phone, date), CSV export
│   │       ├── referrals/            # Referral pipeline — referred applications enriched with referrer info, investment totals, bonus amounts; toggle bonus paid/unpaid; CSV export
│   │       └── logs/                 # System event log viewer — enriched with investor name/email; filterable by investor
│   ├── (admin-public)/      # Admin login page — no layout guard
│   └── api/
│       ├── otp/
│       │   ├── send/route.ts    # Generates HMAC OTP token + sends code via Gmail
│       │   └── verify/route.ts  # Verifies token signature + expiry (10 min)
│       ├── password-reset/
│       │   ├── send/route.ts    # Generates HMAC reset token + sends link via Gmail
│       │   └── reset/route.ts   # Verifies token + updates password via supabaseAdmin
│       ├── register/route.ts    # Public registration — inserts investor_applications, notifies admin via Gmail
│       ├── contact/route.ts     # Contact form + HelpButton — sends to admin via Gmail
│       ├── lead/notify/route.ts # Lead notifications (OtpGate unlock + express interest)
│       ├── referral/
│       │   ├── interest/route.ts    # GET: check if current investor signed up; POST: upsert row in referral_interest
│       │   └── my-referrals/route.ts # GET: investor's referred applications with investment totals + bonus amounts
│       ├── track/
│       │   └── open/route.ts     # GET: 1×1 transparent GIF pixel — logs email open to email_events (fire-and-forget)
│       ├── insights/
│       │   └── diversification/route.ts # GET: cross-investor diversification stats (supabaseAdmin); MIN_COHORT=5 guard
│       └── admin/
│           ├── applications/route.ts # Application review (GET, PATCH approve/reject) — approve runs same flow as investors POST
│           ├── users/route.ts        # Investor CRUD (GET, POST, PATCH, DELETE)
│           ├── investments/route.ts  # Investment creation (POST) + list by userId (GET)
│           ├── transactions/route.ts # Capital transaction CRUD (GET, POST, DELETE)
│           ├── pools/route.ts        # Pool listing + investor summary aggregation
│           ├── payouts/route.ts      # Payout CRUD + investor/asset detail join (GET, POST, PATCH, DELETE)
│           ├── declarations/route.ts # ROI declaration CRUD per pool per quarter
│           ├── opportunities/route.ts # Opportunity CRUD (listing metadata — no JSONB content fields)
│           ├── opportunity-categories/route.ts # Category CRUD (image_url, volatility_level added)
│           ├── loans/route.ts        # Loan CRUD (GET, POST, PATCH, DELETE) — auto-generates EMI schedule on POST
│           ├── loan-emis/route.ts    # EMI record fetch (GET by loan_id) + mark paid (PATCH)
│           ├── referral-interest/route.ts # GET referral sign-ups enriched with investor name, phone, auth email
│           ├── referrals/route.ts         # GET: all referred applications with bonus amounts; PATCH: mark bonus paid/unpaid
│           └── broadcast/
│               ├── route.ts          # GET recipients preview; POST sends email broadcast + logs result
│               ├── logs/route.ts     # GET broadcast history (last 50)
│               └── upload-image/route.ts # POST upload image → Supabase Storage → returns public URL
├── components/              # Shared UI components
│   ├── OtpGate.tsx          # Email OTP gate for marketing opportunity pages
│   ├── HelpButton.tsx       # Floating help widget in investor dashboard
│   └── ReinvestBanner.tsx   # Dismissible top banner on debt fund page when ?ref=reinvest — shows projected annual/quarterly return
├── lib/
│   ├── mailer.ts            # Nodemailer transporter — sendOtpEmail, sendAdminEmail,
│   │                        #   sendInvestorWelcomeEmail (embeds 1×1 pixel), sendPasswordResetEmail
│   ├── formatters.ts        # formatCurrency() — always use this, never manual ₹ formatting
│   ├── payoutUtils.ts       # getPayoutStatus(), getNextPayoutDetails() — shared payout logic
│   ├── logger.ts            # logEvent() — structured logging to Supabase
│   ├── referralBonus.ts     # calcReferralBonus(), REFERRAL_TIERS — shared bonus logic (≥5L → ₹3k; >10L → 0.75% max ₹10k)
│   ├── supabaseClient.ts    # Browser Supabase client (singleton)
│   ├── supabaseServer.ts    # Server Supabase client
│   └── supabaseAdmin.ts     # Service-role client — admin operations only
├── proxy.ts                 # Auth guard (Next.js 16 middleware) — protects /dashboard/* and /admin/*
└── sql_scripts/
    ├── row_level_policy.sql              # RLS policies for all tables
    ├── loans_migration.sql               # loans + loan_emi_payments tables
    ├── referral_interest_migration.sql   # referral_interest table + RLS (user can only read/write own row)
    ├── email_events_migration.sql        # email_events table — email open tracking (type, ref_id, uid, user_agent)
    └── referral_bonus_migration.sql      # adds referral_bonus_amount, referral_bonus_paid, referral_bonus_paid_at to investor_applications
```

## Key Conventions

### Authentication Flow
- `src/proxy.ts` (Next.js 16 middleware) protects `/dashboard/*` and `/admin/*` routes.
  - `/dashboard/*` → redirects unauthenticated users to `/login?next=<path>`
  - `/admin/*` → redirects to `/admin/login` (skipped for `/admin/login` itself)
- Admin routes have a second server-side guard in `(admin)/layout.tsx` checking `user.email === process.env.ADMIN_EMAIL`.
- Dashboard layout sets `hustlers_investor_verified = true` in `localStorage` on successful auth. This key allows investors to bypass the OtpGate modal when navigating to opportunity pages from the dashboard — **do not remove this localStorage key or replace it with session checks** in the `(marketing)` module.
- OTP verification on business-model pages uses HMAC tokens (`/api/otp/send` → `/api/otp/verify`). The OTP code is emailed server-side — it never reaches the browser.

### Email (Nodemailer + Gmail SMTP)
- **All email sending is server-side** via `src/lib/mailer.ts`. Never send email from client components.
- `sendOtpEmail` — OTP verification code to prospect
- `sendAdminEmail` — generic admin notification (contact form, help button, lead alerts)
- `sendInvestorWelcomeEmail` — welcome email with temp password when admin creates investor
- `sendPasswordResetEmail` — password reset link email
- Gmail credentials: `GMAIL_USER` + `GMAIL_APP_PASSWORD` (Google App Password, not account password)
- Do **not** reintroduce EmailJS — it was fully removed. The package `@emailjs/browser` is not installed.

### Password Reset Flow
- `/forgot-password` view on login page → POST `/api/password-reset/send` → HMAC-signed token (1 hour expiry) sent via Gmail
- `/reset-password?token=...` page → POST `/api/password-reset/reset` → verifies signature + expiry → `supabaseAdmin.auth.admin.updateUserById`
- Requesting a reset does **not** invalidate the existing password — old password keeps working until the user submits a new one.

### Admin Investor Creation
- Password is auto-generated server-side (`crypto.randomBytes`) — never set manually.
- Welcome email (temp password + login URL) is sent via Gmail immediately after creation.
- `tempPassword` is never returned to the browser.

### Supabase Queries
- Always use `.in('investment_id', ids)` batch queries instead of `Promise.all(investments.map(...))` per-row fetches.
- Group results in-memory with `reduce` after a single batch fetch.
- Use `Promise.all([...])` to parallelize independent queries (e.g., profile + assets on dashboard load).
- `company_pools` primary key is `purchase_id` (not `id`).

### Currency Formatting
- Always use `formatCurrency(amount)` from `@/lib/formatters` — never `₹${(val/100000).toFixed(2)} L` or `.toLocaleString()` inline.
- For public-facing cards and compact displays use `formatCurrencyCompact(amount)` — amounts ≥1Cr render as `₹2Cr`, else `₹50L`.
- In PDF generation only, use the local `safeFormatIN` helper (avoids the `¹` Unicode bug in jsPDF).

### Derived State
- Prefer `useMemo` for values derived from existing state — avoid separate state + `useEffect` pairs.
- Module-level pure functions (e.g., `buildChartData`) are preferred over functions defined inside components.

### SEO / Metadata
- All pages in `(marketing)/` that are `"use client"` components cannot export metadata directly. Wrap them with a server component `layout.tsx` at the same route segment that exports metadata and passes `children` through.

### Error Handling
- Dashboard has a `retryCount` state pattern: `useEffect` depends on `[retryCount]`, and the Retry button increments it to re-trigger the fetch.
- `src/app/(dashboard)/dashboard/error.tsx` is the error boundary for all dashboard routes.
- `src/app/(admin)/admin/error.tsx` is the error boundary for all admin routes — same retry pattern, CTA button uses brand green (`bg-[#05CE78] hover:bg-[#04b86c]`).

### Security
- CSP headers are set in `next.config.ts` — update `connect-src` if adding new external API domains.
- `OTP_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `GMAIL_APP_PASSWORD`, `CRON_SECRET` are server-only — never prefix with `NEXT_PUBLIC_`.
- Never commit `.env` or `.env.local`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values:

```
NEXT_PUBLIC_SITE_URL          # Production URL (e.g. https://hustlersventures.co)
NEXT_PUBLIC_CONTACT_EMAIL     # Admin notification recipient email
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role key (Settings → API)
OTP_SECRET                    # Server-only — 32+ char random string for HMAC signing
ADMIN_EMAIL                   # Email allowed to access /admin console
GMAIL_USER                    # Gmail address used as sender for all emails
GMAIL_APP_PASSWORD            # Google App Password (not account password)
META_WA_PHONE_NUMBER_ID       # Meta WhatsApp Business phone number ID
META_WA_ACCESS_TOKEN          # Meta WhatsApp Business API access token
META_WA_TEMPLATE_CREDENTIALS  # Approved template name for investor credentials (3 params: name, email, tempPassword)
META_WA_TEMPLATE_BROADCAST    # Approved template name for WhatsApp broadcasts (1 param: message body)
CRON_SECRET                   # Server-only — random string; Vercel injects as Bearer token on cron calls
GOOGLE_SERVICE_ACCOUNT_KEY    # Minified JSON of Google service account credentials — Drive API read access for opportunity photo galleries
DEFAULT_INVESTOR_PASSWORD     # Default fallback password for onboarding flow (server-only)
ONBOARDING_SECRET             # Secret for signing onboarding invite tokens (server-only)
```

## Common Commands

Prerequisites: Node.js v18+, npm.

```bash
npm install     # Install dependencies
npm run dev     # Start dev server (http://localhost:3000)
npm run build   # Production build
npm run start   # Start production server
npm run lint    # ESLint
```

## Database Tables (Supabase)

Key tables queried in the portal:

| Table | Purpose |
|---|---|
| `investors` | Investor profile (investor_id, investor_name, user_id, phone, pan_number, requires_password_change) |
| `investor_investments` | Investment records joined with company_pools; `total_amount` is auto-synced by trigger |
| `investor_transactions` | Capital add/withdrawal records (transaction_id, investment_id FK, investment_amount, transaction_type: 'add'\|'withdrawal', remarks, receipt_url). Trigger `trg_sync_investment_total` updates `investor_investments.total_amount` after each INSERT |
| `company_pools` | Pool metadata (purchase_id PK, pool_name, status, total_cost, investor_amount, etc.) |
| `investor_quarterly_payments` | Payout records (gross, net, TDS, emergency fund, payment_date) |
| `quarterly_roi_declarations` | Quarter labels and month names for payout chart grouping |
| `investor_applications` | Self-registration applications (name, email, phone, pan_number, bank_account, ifsc, associate_name, status: pending/approved/rejected, notes, reviewed_at) |
| `system_logs` | Structured event log — columns: `id`, `level` ('INFO'\|'WARN'\|'ERROR'), `message`, `metadata` (JSONB), `created_at`. No other columns. Always include `metadata.userId` (auth user UUID) for enrichment. |

Row-level security policies are in `src/sql_scripts/row_level_policy.sql`.

## Admin Console Conventions

- All admin tables support **column sorting** — each column header is clickable with a `ChevronUp` / `ChevronDown` / `ChevronsUpDown` icon indicating sort state. Sort state is local (`useState`), computed with `useMemo` on the fetched data.
- All admin list pages support **search** filtering (client-side, on the fetched data) and **CSV export** via `exportToCsv` from `@/lib/exportCsv`.
- Payouts are linked to **ROI declarations** (`declaration_id` FK). Creating a payout requires selecting a declaration first; the gross amount is auto-calculated from the declaration's ROI % × investment amount.
- The `investor_quarterly_payments` table tracks: `gross_roi_amount`, `emergency_fund_deduction`, `tds_deduction`, `net_payable_amount`, `payment_date`, `payment_reference`, `receipt_url`, `fd_returns`, `months_considered`, `is_tds_filed`.
- Admin API routes use `supabaseAdmin` (service-role) — they bypass RLS and must only be called from server-side route handlers, never from client components.
- **Investor registration flow**: prospects submit `/register` → `investor_applications` table (status: pending) → admin reviews at `/admin/applications` → approve runs the same auth user + investor record + welcome email flow as manual creation. Bank account number is stored as plain text in `investor_applications` (admin-only access via service-role). The `/api/register` route is intentionally public (no auth) — duplicate email check prevents spam.
- **Server-side logging**: admin API routes log to `system_logs` directly via `supabaseAdmin.from("system_logs").insert({ level, message, metadata })` — do NOT use `logEvent()` from `lib/logger.ts` in server routes (it uses the browser Supabase client). Always include `metadata: { ..., userId: user.id }` (auth user UUID, not investor_id) so the logs page can enrich entries with investor name and email.
- **System logs enrichment**: the `/api/admin/logs` route resolves `metadata->>userId` (auth user UUID) → `investors.investor_name` and `auth.users.email`. The logs page (`/admin/logs`) supports investor name/email search via a debounced filter input.
- **Primary CTA buttons** (form submit, save, create) use `bg-[#05CE78] hover:bg-[#04b86c] text-white` — never `bg-[#0B1120] hover:bg-[#05CE78]` on white backgrounds. Active/selected state indicators (pagination active page, active filter tab) intentionally use `bg-[#0B1120]`.
- **Apple glow on public-facing CTAs**: marketing and auth page primary buttons use an inline `style` box-shadow: `0 0 0 1px rgba(5,206,120,0.3), 0 0 40px rgba(5,206,120,0.45), 0 0 80px rgba(5,206,120,0.2)`. Admin console buttons do not use this glow.
- **Hero section radial blobs**: all dark hero sections use a dual centered blob pattern — one large (`w-[900px] h-[500px] bg-[#05CE78]/10 blur-[120px]`) centered at 50%/50%, one smaller (`w-[400px] h-[200px] bg-[#05CE78]/8 blur-[80px]`) centered at 50%/33%. Never use a single off-center blob.
- **No em dashes in UI copy**: never use `—` or `–` as sentence connectors in rendered text. Replace with commas or periods. En dashes in numeric ranges (e.g. `12–16%`) and `—` as null-value placeholders in data cells are acceptable.
- **Typography minimum**: `text-xs` is the smallest allowed font size across all admin and dashboard pages — never use `text-[10px]` or smaller. Labels use `text-xs font-semibold text-gray-500` minimum contrast (never `text-gray-400` for labels).
- **Email Broadcasts** (`/admin/broadcasts`): send HTML emails to filtered investor groups or arbitrary email addresses. Recipient filters: All / Active / Exited / By Pool / Specific Emails (comma-separated). Images are uploaded to Supabase Storage bucket `broadcast-images` and embedded inline in the email body. All sends are logged to `broadcast_logs` table. The compose form is a modal; the history is a sortable/searchable table with CSV export. Pool filter uses `purchase_id` (not `pool_id`) on `investor_investments`.
- **Opportunities admin form** manages listing metadata only (title, IRR, min investment, image, status, volatility, detail_url, etc.). JSONB content editors (hero_metrics, highlights, deal_terms, timeline, etc.) have been removed — detail page content lives in static component files per opportunity.
- **Opportunity detail page strategy**: existing opportunities have static pages (`transportation/pool-6`, `hospitality/varanasi-zostel`, `fnb/jadcherla-restaurant`, `debt-funds/debt-fund-series-1`). New opportunities use the generic `[categorySlug]/[opportunitySlug]/page.tsx` template. The `detail_url` field on an opportunity links the card CTA to the correct page.
- **Volatility badges**: `volatility_level` ('Low'/'Medium'/'High') and `volatility_note` exist on both `opportunities` and `opportunity_categories`. Badges are shown on public listing pages, home page Active Opportunities, and investor dashboard. Use Low=green, Medium=amber, High=red.
- **Notification read tracking**: `notification_reads` table tracks per-investor read state for broadcasts and payouts. Dashboard layout fetches unread count from `/api/notifications/unread-count`. Notifications page marks all visible items as read on mount via `POST /api/notifications`.
- **Loan tracking** (`/admin/loans`): tracks loans disbursed from the business (or personal). Loan types: Hand Loan, Term Loan, Working Capital Loan, Business Loan, Other. EMI schedule is auto-generated on creation using the reducing-balance method — inserts N rows into `loan_emi_payments`. EMIs can be marked paid one-by-one from the EMI drawer. Overdue detection happens on fetch (due_date < today and status = pending). Migration at `src/sql_scripts/loans_migration.sql`.
- **Referral Early Access** (`/admin/referral-interest`): lists investors who signed up for the referral program via the Insights page. Enriched with auth email via `supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })`. `Gift` icon in AdminNav. Sortable by investor name, email, or sign-up date; CSV export.

## Database Tables (additional)

| Table | Purpose |
|---|---|
| `broadcast_logs` | Email broadcast history — subject, body, image_urls, recipient_filter JSONB, sent/failed counts, results JSONB, created_by |
| `notification_reads` | Per-investor read tracking — user_id, notification_type ('broadcast'\|'payout'), notification_id; UNIQUE(user_id, notification_type, notification_id) for idempotent upserts |
| `opportunity_categories` | Category definitions — name, slug, sort_order, is_active, `image_url` (local path e.g. `/opportunities/transportation-thumbnail.png`), `volatility_level` ('Low'\|'Medium'\|'High') |
| `opportunities` | Investment opportunities — listing metadata only: title, slug, tagline, description, min_investment, target_irr, tenure, total_pool_size, filled_pct, image_url, brochure_url, `detail_url` (links card CTA to static detail page), whatsapp_number, gallery_folder_id, `volatility_level`, `volatility_note`, status, is_public, is_for_investor, sort_order. Detail page content lives in static component files, not in JSONB fields. |
| `loans` | Loan records — borrower_name, loan_type ('Hand Loan'\|'Term Loan'\|'Working Capital Loan'\|'Business Loan'\|'Other'), principal, interest_rate (% p.a.), tenure_months, disbursal_date, maturity_date, status ('active'\|'closed'\|'defaulted'), pool_id FK (optional) |
| `loan_emi_payments` | EMI schedule — one row per EMI; emi_number, due_date, paid_date, emi_amount, principal_component, interest_component, outstanding_principal, status ('pending'\|'paid'\|'overdue'), payment_reference. Auto-generated (reducing-balance) on loan creation via POST /api/admin/loans. |
| `referral_interest` | Referral program early access — id uuid PK, user_id uuid FK UNIQUE (auth.users), investor_id uuid FK (investors), created_at. RLS: investors can only read/write their own row. |
| `email_events` | Email open tracking — email_type ('welcome'\|'broadcast'), ref_id (broadcast_log UUID or base64(email) for welcome), uid (base64url(email) — who opened), user_agent, created_at. Service-role only (no RLS policies). Indexed on (email_type, ref_id) and uid. |

## Dashboard Design System

### Layout chrome
- **Sidebar**: dark `#0B1120` — navigation only, always dark.
- **Top header**: white `bg-white border-b border-gray-200` — changed from dark. Keep it white.
- **Page background**: `bg-gray-50`.

### Dashboard page sections (in order)
1. **Hero card** — dark `#0B1120` with green/blue/violet glow blobs and dot-grid texture. Shows "Capital Deployed" (`totalInvested` only — never `totalInvested + totalLifetimeReturns`). Inline chips: `+₹X earned`, in-reserve (blue), last-year IRR (green). Right side: Assets mini-card (scrolls to asset breakdown), Last Payout mini-card, Portfolio PDF button. Progress bar: `totalLifetimeReturns / totalInvested`. Persistent "Simulate compounding on Insights" link at bottom of left column.
2. **Debt fund cross-sell card** — light cyan (`bg-white` with cyan gradient wash + `border-l-4 border-cyan-500`), shown only when `totalLifetimeReturns > 0`. Nudges investor to deploy payouts into Debt Fund Series 1 at 12–16%. CTA links to `/opportunities/debt-funds/debt-fund-series-1?amount=X&ref=reinvest` (new tab). Badge says "Add to Position" if investor already holds debt, else "Reinvest".
3. **Explore investment ideas** — dark `#0B1120` card, shown when `dashOpportunities.length > 0`. Cards link to `o.detail_url` (new tab) for active; coming-soon cards trigger express-interest modal. Subtitle: "Active ideas across all verticals".
4. **Portfolio Mix** — white card with Recharts donut chart; shown only when `categoryBreakdown.length >= 2`.
5. **Asset Breakdown cards** — vertical card grid: **2-col if ≤5 assets, 3-col if >5**. Each card has accent top strip + gradient header wash + 2×2 stat grid + capital-returned bar. Accent color comes from `PALETTE[paletteIndex]`. Sortable by invested/payouts/IRR; paginated.
6. **Payout Trajectory + Historical Performance + Capital Timeline** — single white card with 3-tab switcher. Trajectory: stacked BarChart by investment using `buildChartData()`, time-range filter (6M/1Y/3Y/ALL), net/gross toggle. Historical: CSS progress bars per year vs FD/Nifty benchmark, color-coded green ≥22%, amber ≥15%. Capital Timeline: AreaChart of cumulative capital deployed over time from `investor_transactions`; x-axis uses unique `idx` per point (not date string) to handle same-day transactions; appends a "Today" anchor point so the axis always extends to current date.

### PALETTE (10 colors — shared between chart bars and asset card accents)
```ts
const PALETTE = [
  "#05CE78", "#3B82F6", "#6366F1", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#10B981", "#06B6D4", "#F97316",
];
```
Assignment is by index in the original `investments` array order (not sorted order). When rendering `sortedInvestments`, look up the palette index with `investments.findIndex(i => i.investment_id === inv.investment_id)`.

### Payout data fetch
The quarterly payments query must join `quarterly_roi_declarations` for quarter labels:
```ts
.select("investment_id, gross_roi_amount, net_payable_amount, payment_date, months_considered, emergency_fund_deduction, tds_deduction, quarterly_roi_declarations(quarter_year, month_names)")
```
The `Payout` interface uses `emergency_fund` and `tds_amount` (not `_deduction`) after mapping.

### Typography in cards
- Stat labels: `text-xs text-gray-500 font-semibold uppercase tracking-wide` — never `text-[10px]` or `text-gray-400` (too small / too low contrast).
- Stat values: `text-base font-black` or `text-2xl font-black`.
- Sub-text: `text-xs text-gray-500`.

## Brand Colors

- Dark background: `#0B1120`
- Brand green: `#05CE78`
- Hover green: `#04b86c`
