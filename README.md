# Hustlers Ventures — Investor Portal

<img src="public/logo.svg" alt="Hustlers Ventures" width="120" height="120" />

> **Building Scalable High-Yield Business Models through Surgical Execution**

**Hustlers Ventures** is a premier investment platform transforming unorganized sectors into institutional-grade assets, allowing investors to co-own high-yield real-world businesses across **Intercity Transportation (Fleet)**, **Hospitality (Zostel)**, **Highway F&B**, and **Debt Funds**.

This repository contains the full-stack web platform: public marketing site + OTP-gated opportunity pages + secure investor dashboard + admin console. Deployed on **Vercel**.

---

## Features

### Public Platform
- **Asset Marketplace** — DB-driven category listing with per-category thumbnail images and risk/volatility badges; opportunity cards link to static detail pages (Pool 6, Zostel Varanasi, Jadcherla, Debt Fund Series 1) or a generic DB-driven template for new opportunities
- **Risk / Volatility Badges** — Low / Medium / High risk level shown on category cards, opportunity cards (public + dashboard), and home page Active Opportunities
- **Investment Calculator** — interactive ROI simulator per opportunity with adjustable investment amount; formula type per asset class (transport, F&B, hospitality)
- **Photo Gallery** — Google Drive-backed photo gallery per opportunity, fetched via service account auth
- **OTP-Gated Business Model Pages** — financial breakdowns unlocked after email OTP verification
- **Contact Form** — inquiry routing directly to the core team

### Investor Dashboard
- **Hero Overview** — capital deployed, lifetime returns earned, blended IRR badge, and capital-returned progress bar; inline milestone badges (tenure, deployed capital, payout count)
- **Debt Fund Cross-sell Card** — light cyan card shown when the investor has received payouts, nudging them to reinvest in Debt Fund Series 1 at 14–16%; pre-fills amount and links directly to the fund page
- **Payout Trajectory Chart** — stacked bar chart per investment with 6M / 1Y / 3Y / ALL time-range filter and net/gross toggle
- **Historical Performance Panel** — annual yield bars (color-coded: green ≥22%, amber ≥15%) with FD / Nifty 50 benchmark comparison
- **Capital Timeline** — area chart showing cumulative capital deployed over time from all capital transactions; x-axis extends to today so all dots are visible
- **Portfolio Mix** — Recharts donut chart showing allocation by sector with per-sector yield; shown for investors with 2+ categories
- **Asset Breakdown Cards** — vertical card grid (2-col for ≤5 assets, 3-col for >5); each card shows Invested, Lifetime Payouts, IRR, Next Payout, and a capital-returned progress bar with per-asset accent colors; sortable by invested/payouts/IRR
- **Exited Investments** — orange "Exited" badge, closed date, capital-returned display; IRR still shown using time-weighted method
- **PDF Report** — one-click downloadable portfolio statement (client-side, jsPDF)
- **Notification Center** — payout alerts + email broadcast announcements with per-item read/unread tracking via `notification_reads` table
- **Help Button** — in-dashboard message form routed to the team
- **Investment Opportunities** — DB-driven tab showing active and coming-soon deals with thumbnail images, volatility badges, and direct detail page links (new tab)
- **Insights Page** — Compound Growth Simulator (line chart, 1Y/3Y/5Y/10Y horizons), Payout Consistency (std dev volatility score per asset), Reinvestment Behaviour (capital adds vs net payouts), Investor Trends social proof (% diversified, % within 6 months), Referral Program Coming Soon with one-click early access sign-up

### Admin Console (`/admin`)
Invite-only, gated by `ADMIN_EMAIL` server-side. All tables support column sorting, client-side search, and CSV export.

- **Overview Dashboard** — stat cards (Total Investors, Deployed Capital, Disbursed, Active Opportunities) with period filter; analytics charts (Monthly Disbursements bar, Capital by Pool horizontal bar, Investor Growth area); recent registrations, recent payouts, system logs
- **Investor Management** — add, edit, delete investors; auto-generates temp password and sends welcome email; expandable detail view with investments, payouts, capital transactions, and activity timeline
- **Investment Management** — link investments to investors; Active/Exited badges; CSV export
- **Payout Management** — create and edit payout records linked to ROI declarations; tracks gross, TDS, emergency fund deduction, net payable, payment date, reference, receipt URL, FD returns, TDS filing status
- **Pool Management** — full CRUD with investor summary view and utilisation bar (fill % vs total cost)
- **ROI Declarations** — declare quarterly ROI per pool (quarter label, ROI %, month names, emergency fund amount, finalized flag)
- **Opportunities Management** — CRUD for listing metadata (title, IRR, min investment, image, status, volatility, detail_url); visibility toggles (public / investor dashboard); linked investments modal. Detail page content lives in static component files — no JSONB editors.
- **Opportunity Categories** — manage categories (Transportation / Hospitality / F&B / Debt Funds) with thumbnail image path, risk level (Low/Medium/High), and active/inactive toggle
- **Email Broadcasts** — compose and send HTML emails to filtered investor groups (All / Active / Exited / By Pool) or any specific email addresses; inline image upload via Supabase Storage; preview before send; broadcast history with sortable table and CSV export
- **Global Search** — ⌘K search across investors, investments, and opportunities
- **System Logs** — structured event log viewer
- **Loan Tracking** — track loans (Hand Loan, Term Loan, Working Capital, Business Loan, etc.) with auto-generated reducing-balance EMI schedules; mark EMIs paid one-by-one; overdue detection; CSV export; linked to a pool (optional)
- **Referral Tracking** (`/admin/referrals`) — full referral pipeline: referred investor applications enriched with referrer name/code, investment totals, and calculated bonus amounts (₹3,000 flat for ≥5L; 0.75% up to ₹10,000 for >10L); toggle bonus paid/unpaid per row; summary cards; CSV export
- **Applications** — review self-registration applications; approve/reject with one click; pending badge in nav

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19, React Compiler) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database / Auth | Supabase (PostgreSQL, RLS, Auth) |
| Supabase client | `@supabase/ssr` — `createBrowserClient` / `createServerClient` |
| Email | Nodemailer + Gmail SMTP (server-side, all transactional emails) |
| File Storage | Supabase Storage (broadcast images) |
| Google Drive | googleapis service account (opportunity photo galleries) |
| PDF generation | jsPDF + jspdf-autotable (client-side) |
| Charts | Recharts |
| Icons | lucide-react |
| Deployment | Vercel (with cron job for profile reminders) |

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm
- Supabase project
- Gmail account with 2-Step Verification enabled (for App Password)
- Google Cloud project with Drive API enabled (for opportunity galleries)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/surya532/Investor-Portal.git
   cd investor-portal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment setup** — copy `.env.example` to `.env.local` and fill in values:
   ```bash
   cp .env.example .env.local
   ```

   | Variable | Description |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | Production URL (e.g. `https://hustlersventures.co`) |
   | `NEXT_PUBLIC_CONTACT_EMAIL` | Admin notification recipient |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Supabase → Settings → API) |
   | `OTP_SECRET` | 32+ char random string for HMAC signing |
   | `ADMIN_EMAIL` | Email address allowed to access `/admin` |
   | `GMAIL_USER` | Gmail address used to send all emails |
   | `GMAIL_APP_PASSWORD` | Google App Password (Account → Security → 2-Step → App Passwords) |
   | `GOOGLE_SERVICE_ACCOUNT_KEY` | Minified JSON of Google service account credentials (Drive API read access for galleries) |
   | `META_WA_PHONE_NUMBER_ID` | Meta WhatsApp Business phone number ID |
   | `META_WA_ACCESS_TOKEN` | Meta WhatsApp Business API access token |
   | `META_WA_TEMPLATE_CREDENTIALS` | Approved WhatsApp template for investor credentials (3 params: name, email, tempPassword) |
   | `META_WA_TEMPLATE_BROADCAST` | Approved WhatsApp template for broadcasts (1 param: message body) |
   | `DEFAULT_INVESTOR_PASSWORD` | Default password for new investor accounts |
   | `ONBOARDING_SECRET` | Secret for signing onboarding invite tokens |

4. **Run database migrations** — execute SQL scripts in Supabase SQL Editor:
   - `src/sql_scripts/row_level_policy.sql` — RLS policies for all tables
   - `src/sql_scripts/opportunities.sql` — opportunities and categories tables
   - `src/sql_scripts/broadcast_logs.sql` — email broadcast history table
   - `src/sql_scripts/loans_migration.sql` — loans and loan_emi_payments tables
   - `src/sql_scripts/referral_interest_migration.sql` — referral program early access table
   - `src/sql_scripts/email_events_migration.sql` — email open tracking table
   - `src/sql_scripts/referral_bonus_migration.sql` — referral bonus columns on investor_applications
   - `src/sql_scripts/support_migration.sql` — support_threads, support_messages, message_attachments tables
   - `src/sql_scripts/support_rls.sql` — RLS policies for the support tables (run after support_migration.sql)
   - `src/sql_scripts/support_category_update_migration.sql` — only if support_migration.sql was already applied before the category list changed
   - `src/sql_scripts/support_status_automation_migration.sql` — only if support_migration.sql was already applied before priority was removed and status automation was added
   - `src/sql_scripts/support_remove_internal_notes_migration.sql` — only if support_migration.sql/support_rls.sql were already applied before internal notes were removed
   - `src/sql_scripts/support_remove_assigned_migration.sql` — only if support_migration.sql was already applied before per-ticket assignment was removed
   - `src/sql_scripts/support_reminders_migration.sql` — only if support_migration.sql was already applied before the hourly reminder feature was added
   - `src/sql_scripts/support_reminders_cron_migration.sql` — schedules the hourly reminder check via Supabase pg_cron + pg_net (Vercel Hobby can't run hourly cron); fill in the placeholders before running, see the file's header comment

5. **Create Supabase Storage buckets:**
   - `broadcast-images` — set to **Public**
   - `support-attachments` — set to **Private** (support ticket attachments are accessed via signed URLs)

6. **Run the development server:**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
public/                  # Static assets (images, logos, opportunity photos)
src/
├── app/
│   ├── (auth)/          # Login, forgot password, reset password
│   ├── (dashboard)/     # Protected investor dashboard
│   │   └── dashboard/
│   │       ├── page.tsx              # Overview: hero, debt fund cross-sell, opportunities, portfolio mix, asset cards, chart
│   │       ├── insights/             # Compound Growth Simulator, Payout Consistency, Reinvestment Behaviour, Investor Trends, Referral CTA
│   │       ├── portfolio/[id]/       # Individual asset detail with time-weighted IRR
│   │       ├── documents/            # Documents Vault — Asset Statements, Tax Summary, PDF generation
│   │       ├── notifications/        # Payout alerts + broadcast announcements (per-item read/unread)
│   │       ├── opportunities/        # DB-driven investment opportunities
│   │       └── settings/             # Profile, security
│   ├── (marketing)/     # Public pages (no auth required)
│   │   └── opportunities/
│   │       ├── page.tsx              # DB-driven category listing (image + volatility from DB)
│   │       ├── [categorySlug]/       # Opportunity cards per category (active/coming_soon/closed)
│   │       │   └── [opportunitySlug]/ # Generic detail page (fallback for new opportunities)
│   │       ├── transportation/pool-6/        # Static detail page — Pool 6 fleet fund
│   │       ├── hospitality/varanasi-zostel/  # Static detail page — Zostel Varanasi
│   │       ├── fnb/jadcherla-restaurant/     # Static detail page — Jadcherla F&B
│   │       └── debt-funds/debt-fund-series-1/ # Static detail page — Debt Fund Series 1
│   ├── (admin)/         # Admin console (guarded by ADMIN_EMAIL)
│   │   └── admin/
│   │       ├── page.tsx              # Admin overview dashboard
│   │       ├── investors/            # Investor management + detail view
│   │       ├── investments/          # Investment management
│   │       ├── payouts/              # Payout + declaration management
│   │       ├── pools/                # Pool CRUD + utilisation bars
│   │       ├── broadcasts/           # Email broadcast compose + history
│   │       ├── opportunities/        # Opportunity CRUD (listing metadata only — static detail pages)
│   │       ├── opportunity-categories/ # Category management (image, risk level)
│   │       ├── loans/                # Loan tracking + EMI schedule drawer
│   │       ├── referral-interest/    # Referral early access sign-up list
│   │       ├── applications/         # Investor application review
│   │       └── logs/                 # System event log viewer
│   ├── (admin-public)/  # Admin login (no layout guard)
│   └── api/
│       ├── otp/                      # HMAC OTP send + verify
│       ├── password-reset/           # Reset link send + verify
│       ├── register/                 # Public investor self-registration
│       ├── contact/                  # Contact form + help button
│       ├── lead/notify/              # Lead notification emails
│       ├── referral/interest/        # GET: check sign-up; POST: upsert referral_interest row
│       ├── referral/my-referrals/    # GET: investor's referred applications with bonus amounts
│       ├── track/open/               # GET: 1×1 pixel — logs email open event to email_events
│       ├── insights/diversification/ # GET: cross-investor diversification stats (supabaseAdmin)
│       ├── opportunities/
│       │   ├── public/               # Unauthenticated: active+public opportunities
│       │   ├── investor/             # Auth-gated: investor-facing opportunities
│       │   └── gallery/              # Google Drive folder → image list (service account)
│       └── admin/
│           ├── users/                # Investor CRUD
│           ├── investments/          # Investment management
│           ├── transactions/         # Capital transaction CRUD
│           ├── pools/                # Pool listing + investor summary
│           ├── payouts/              # Payout CRUD
│           ├── declarations/         # ROI declaration CRUD
│           ├── opportunities/        # Opportunity CRUD (listing metadata only)
│           ├── opportunity-categories/ # Category CRUD
│           ├── referral-interest/    # Referral sign-ups enriched with investor + auth email
│           ├── referrals/            # GET: all referral applications with bonus amounts; PATCH: mark bonus paid
│           ├── broadcast/            # Email broadcast send + history + image upload
│           ├── search/               # Global admin search
│           └── send-profile-reminders/ # Vercel cron: WhatsApp reminder for incomplete profiles
├── components/
│   ├── OtpGate.tsx          # Email OTP gate for marketing pages
│   ├── HelpButton.tsx       # Floating help widget
│   ├── ReinvestBanner.tsx   # Dismissible top banner on debt fund page when ?ref=reinvest
│   ├── GallerySection.tsx   # Photo gallery (Drive folder or static URLs)
│   ├── ProjectTimeline.tsx  # Timeline component
│   ├── AdminNav.tsx         # Admin sidebar navigation
│   ├── AdminGlobalSearch.tsx # ⌘K global search
│   └── calculators/         # ROI calculator components (Transport, FnB, Hospitality)
├── lib/
│   ├── mailer.ts            # Nodemailer — all transactional emails via Gmail SMTP; pixel tracking in welcome email
│   ├── formatters.ts        # formatCurrency(), formatCurrencyCompact()
│   ├── payoutUtils.ts       # getPayoutStatus(), getNextPayoutDetails()
│   ├── logger.ts            # logEvent() — structured logging to Supabase
│   ├── adminGuard.ts        # guardAdmin() — case-insensitive ADMIN_EMAIL check
│   ├── referralBonus.ts     # calcReferralBonus(), REFERRAL_TIERS — shared bonus calculation logic
│   ├── supabaseClient.ts    # Browser Supabase client
│   ├── supabaseServer.ts    # Server Supabase client
│   └── supabaseAdmin.ts     # Service-role client for admin operations
└── sql_scripts/
    ├── row_level_policy.sql              # RLS policies for all tables
    ├── opportunities.sql                 # Opportunities + categories schema
    ├── broadcast_logs.sql                # Email broadcast history schema
    ├── loans_migration.sql               # Loans + loan_emi_payments tables
    ├── referral_interest_migration.sql   # Referral interest table + RLS
    ├── email_events_migration.sql        # Email open tracking table + indexes
    ├── referral_bonus_migration.sql      # Bonus columns on investor_applications
    ├── support_migration.sql             # Support threads/messages/attachments tables
    ├── support_rls.sql                   # RLS policies for support tables
    ├── support_category_update_migration.sql # One-off fix for the category CHECK constraint/labels
    ├── support_status_automation_migration.sql # One-off: drops priority, makes status automatic
    ├── support_remove_internal_notes_migration.sql # One-off: drops is_internal_note + RLS update
    ├── support_remove_assigned_migration.sql # One-off: drops assigned_admin_email
    ├── support_reminders_migration.sql   # One-off: adds last_reminder_sent_at
    └── support_reminders_cron_migration.sql # One-off: pg_cron + pg_net hourly trigger
```

---

## Common Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server (http://localhost:3000)
npm run build   # Production build
npm run start   # Start production server
npm run lint    # ESLint
```

---

## Key Conventions

- **Currency formatting** — always use `formatCurrency()` from `@/lib/formatters`, never inline `₹` formatting. Use `formatCurrencyCompact()` for public-facing cards (₹2Cr, ₹50L)
- **Admin auth** — all admin API routes call `guardAdmin()` from `@/lib/adminGuard.ts` (case-insensitive email check)
- **Supabase service role** — `supabaseAdmin` bypasses RLS; only use in server-side API routes
- **Email** — all sending is server-side via `src/lib/mailer.ts`; never send from client components
- **Pool FK** — `investor_investments` uses `purchase_id` (not `pool_id`) as the FK to `company_pools`
- **Opportunity detail pages** — existing opportunities use static component files per slug; new ones fall back to the generic `[categorySlug]/[opportunitySlug]` template. The `detail_url` field on an opportunity record links card CTAs to the correct page.
- **Volatility badges** — `volatility_level` on both `opportunities` and `opportunity_categories`; shown on all public listing surfaces and investor dashboard