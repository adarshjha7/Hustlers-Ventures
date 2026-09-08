# Hustlers Ventures — Platform Product Overview

**For:** Product Owners, Stakeholders, Business Partners  
**Version:** June 2026

---

## What is Hustlers Ventures?

Hustlers Ventures transforms high-yield, unorganized real-world businesses into structured investment opportunities. Investors co-own operational assets — intercity buses, hospitality properties, highway restaurants, and debt instruments — and receive quarterly payouts from the revenues those businesses generate.

The platform is a full-stack web product that handles everything from investor discovery and onboarding to portfolio tracking, payout visibility, and ongoing communication.

---

## The Four Asset Verticals

| Vertical | What Investors Own | Payout Source |
|---|---|---|
| **Intercity Transportation (Fleet)** | Shares in intercity bus pools (e.g. Pool 6) | Ticket revenue from bus operations |
| **Hospitality** | Franchise stake in Zostel properties (e.g. Varanasi) | Hostel room bookings and F&B |
| **Highway F&B** | Revenue share in highway restaurant outlets (e.g. Jadcherla) | Dine-in and takeaway sales |
| **Debt Funds** | Structured fixed-income instrument (e.g. Debt Fund Series 1) | Fixed interest on deployed capital |

Target returns range from **14% (Debt Fund)** to **22%+ (Fleet & F&B)** per annum, paid out quarterly.

---

## Who Uses the Platform?

### Investors
Accredited individuals who have been onboarded by the Hustlers Ventures team. They use the platform to:
- Explore active investment opportunities
- Track their portfolio performance
- View and download payout history
- Access documents and notices
- Monitor their capital growth over time

### Prospects
Members of the public who visit the marketing site. They can:
- Learn about investment verticals and opportunities
- Use the investment return calculator
- Submit their interest and apply to invest
- Subscribe to the investor newsletter

### Admin Team (Internal)
The Hustlers Ventures operations team manages the platform through a secure admin console. They:
- Review and approve investor applications
- Record and manage investments and payouts
- Send broadcast communications to investors
- Publish and manage investment opportunities
- Track loans and financial obligations

---

## The Platform at a Glance

The product is divided into three distinct zones:

### 1. Public Marketing Site
The outward-facing website accessible to anyone. It showcases the brand, explains the investment model, and presents live opportunities with details on returns, tenure, and minimum investment. A built-in calculator lets prospects model their potential returns before committing.

Key pages:
- **Home** — Brand introduction, live opportunities, investor testimonials, return calculator, newsletter signup
- **Opportunities** — Browseable listing of all investment categories and active deals
- **About** — Company story and team
- **Contact** — Enquiry form with direct response to the team

Opportunity detail pages include everything a prospective investor needs to make a decision: deal structure, financial projections, risk disclosures, timeline, and a WhatsApp contact for direct enquiry.

### 2. Investor Dashboard
A private, login-protected area for active investors. Every investor sees their own data only.

**What investors see on their dashboard:**

- **Capital Deployed** — Total amount invested across all assets, displayed prominently
- **Total Earnings** — Cumulative returns received to date
- **Portfolio Mix** — Visual breakdown of capital spread across asset classes
- **Asset Cards** — One card per investment showing invested amount, returns received, IRR, and capital return progress
- **Payout History** — Quarter-by-quarter payout chart with gross/net toggle and time filters
- **Upcoming Payout** — Next expected payout date and estimated amount
- **Insights** — Compound growth simulator, payout consistency analysis, and reinvestment behaviour trends
- **Notifications** — Payout alerts and broadcast messages from the team
- **Documents** — Downloadable agreement and statement files
- **Portfolio PDF** — One-click download of a formatted portfolio summary

**Opportunities within the dashboard:**
Active investors also see curated investment opportunities relevant to their profile, with the ability to express interest directly or contact the team via WhatsApp.

### 3. Admin Console
A secure internal tool for the operations team. Key capabilities:

| Area | What It Does |
|---|---|
| **Applications** | Review incoming investor applications; approve or reject with notes; triggers automatic welcome email on approval |
| **Investors** | Full investor roster; create, edit, or remove profiles; bulk CSV export |
| **Investments** | Record capital deployed per investor per pool; capital add/withdrawal tracking |
| **Payouts** | Log quarterly payouts per investor; tracks gross amount, TDS deduction, emergency fund, and net payable |
| **Pools** | Manage investment pools; view per-pool investor summary |
| **ROI Declarations** | Declare quarterly ROI % per pool; drives payout calculation |
| **Loans** | Track loans associated with the business; auto-generates EMI schedules |
| **Broadcasts** | Send HTML email campaigns to all investors or filtered groups (by pool, status, etc.) |
| **Opportunities** | Publish and manage investment opportunities visible on the public site |
| **Categories** | Manage investment category pages (transportation, hospitality, F&B, debt funds) |
| **Referral Program** | View early-access signups for the upcoming referral program |
| **Logs** | Audit trail of all system events |

---

## Investor Lifecycle

```
Prospect discovers platform
        ↓
Browses opportunities on public site
        ↓
Submits application (name, email, phone, PAN, bank details)
        ↓
Admin reviews and approves application
        ↓
Investor receives welcome email with login credentials
        ↓
Investor logs into dashboard
        ↓
Capital is recorded by admin; investment appears on dashboard
        ↓
Quarterly ROI declared → payout calculated → logged in system
        ↓
Investor sees payout on dashboard and receives notification
        ↓
Process repeats each quarter
```

---

## Payout Structure

Payouts are declared quarterly per investment pool. For each investor:

1. Admin declares the ROI percentage for the quarter (e.g. 5.5% for Q1)
2. Gross payout is calculated from invested capital × ROI %
3. Deductions applied: TDS (tax deducted at source) and emergency fund reserve
4. Net payable amount is disbursed to the investor's bank account
5. The payout record is visible immediately on the investor's dashboard

Investors can download a full payout history as part of their portfolio PDF.

---

## Security and Trust

- Every investor account is protected by email and password authentication
- OTP verification adds an extra layer for browsing sensitive opportunity details
- All investor data is isolated — each investor can only see their own portfolio
- Admin access is restricted to a single authorised email address
- All communications (welcome emails, OTP codes, payout notices) are sent from a verified email address
- Password resets are handled via time-limited secure links
- Sessions automatically expire after 30 minutes of inactivity

---

## Communication Capabilities

The platform supports several channels for reaching investors:

| Channel | Purpose |
|---|---|
| **Welcome Email** | Sent on account creation with login credentials |
| **Payout Notification** | In-platform notification when a payout is logged |
| **Email Broadcast** | Admin-composed HTML emails to all or filtered investors |
| **WhatsApp** | Direct link on each opportunity page to reach the team |
| **In-App Notifications** | Unread badge on dashboard for new payouts and broadcasts |

---

## Key Numbers the Platform Tracks

- Total capital deployed (per investor and across all pools)
- Cumulative returns earned (lifetime)
- IRR per asset and per investor
- Quarterly payout amounts (gross, TDS, emergency fund, net)
- Capital return percentage (how much of invested capital has been returned)
- Year-on-year performance vs FD and Nifty 50 benchmarks

---

## Opportunity Management

New investment opportunities are published through the admin console. Each opportunity listing includes:

- Title, tagline, and category
- Minimum investment amount
- Target IRR and tenure
- Pool size and fill percentage
- Status (Active, Coming Soon, or Closed)
- Link to the detailed opportunity page

Detailed opportunity pages (deal structure, financial model, risk disclosures, timeline) are maintained as rich content pages and updated by the product team independently of the database listing.

---

## Referral Program (Coming Soon)

Investors can sign up for early access to a referral program from within the Insights section of their dashboard. The admin console tracks all sign-ups with investor details and timestamps. The program structure and rewards are to be announced.

---

*This document provides a business-level overview of the Hustlers Ventures investor platform. For operational instructions, refer to the Admin Operations Guide. For investor-facing instructions, refer to the Investor Portal Guide.*
