# Hustlers Ventures — Admin Operations Guide

This guide covers all day-to-day operations in the admin console. It is intended for the ops team handling investor onboarding, payouts, and platform maintenance.

---

## Accessing the Admin Console

1. Open the browser and go to `https://hustlersventures.co/admin/login`
2. Enter the admin email and password
3. You will be taken to the Admin Overview dashboard

> The admin console is accessible only to the registered admin email. Do not share the login credentials.

---

## 1. Investor Applications

When a prospect registers via the public registration link (sent with an invite), their application lands here for review.

**Path:** Admin → Applications

### Reviewing a Pending Application

1. Go to **Applications** from the left sidebar
2. Pending applications show a yellow **Pending** badge
3. Click on an application row to expand the details
4. Review the following fields:
   - Full name, email, phone
   - PAN number
   - Bank account number and IFSC
   - Associate name (who referred them)
5. To **Approve:**
   - Click the **Approve** button
   - This automatically creates the investor account, generates a temporary password, and sends a welcome email with login credentials
   - The investor can log in immediately after approval
6. To **Reject:**
   - Click the **Reject** button
   - Optionally add a note explaining the reason
   - The applicant will not receive any notification — reach out manually if needed

> Approving an application is irreversible. Double-check the PAN and bank details before approving.

---

## 2. Managing Investors

**Path:** Admin → Investors

### Adding an Investor Manually

Use this when onboarding an investor directly (without going through the application flow).

1. Go to **Investors** and click **Add Investor**
2. Fill in:
   - Full name
   - Phone number
   - PAN number
   - Bank account number
   - IFSC code
   - Associate name (optional)
3. Click **Create**
4. The system will:
   - Create a Supabase auth account with a randomly generated temporary password
   - Send a welcome email to the investor with their login credentials
5. The investor is now listed in the table

### Editing an Investor

1. Find the investor using the search bar (search by name or phone)
2. Click the **Edit** icon on their row
3. Update the required fields and click **Save**

### Deleting an Investor

1. Find the investor and click the **Delete** icon
2. Confirm the deletion
3. This removes the investor record — their auth account and investments are not automatically deleted. Contact the developer before deleting an investor with active investments.

### Exporting the Investor List

- Click **Export CSV** at the top of the Investors page to download a full list

---

## 3. Pools

Pools represent individual investment assets (e.g., Pool 6 Sleeper Fleet, Zostel Varanasi).

**Path:** Admin → Pools

### Viewing a Pool

1. Go to **Pools**
2. Each row shows the pool name, status, total cost, and investor amount
3. Click a pool row to see the **Investor Summary** — a breakdown of which investors are in the pool and how much each has invested

### Creating a New Pool

1. Click **Add Pool**
2. Fill in:
   - Pool name
   - Status (Active / Closed)
   - Total cost
   - Investor amount (the portion open to investors)
3. Click **Save**

> After creating a pool, you will need to add investments linking investors to this pool (see Section 4).

---

## 4. Investments

An investment links an investor to a specific pool with a capital amount.

**Path:** Admin → Investments

### Adding an Investment

1. Go to **Investments** and click **Add Investment**
2. Select the **Investor** from the dropdown
3. Select the **Pool** they are investing in
4. Enter the investment amount
5. Set the investment date
6. Click **Save**

> The investor's total investment amount is automatically calculated from all their transactions (capital additions and withdrawals) linked to this investment record.

### Adding a Capital Transaction (Top-up or Withdrawal)

When an investor adds more capital or withdraws:

1. Go to **Investments**
2. Find the investment record and click to open it
3. Click **Add Transaction**
4. Select type: **Add** (top-up) or **Withdrawal**
5. Enter the amount, date, and remarks
6. Click **Save**
7. The investment's total amount updates automatically

---

## 5. ROI Declarations

Before processing payouts, you must declare the ROI percentage for each pool for a specific quarter.

**Path:** Admin → Declarations

### Creating a Declaration

1. Go to **Declarations** and click **Add Declaration**
2. Select the **Pool**
3. Enter the **Quarter Label** (e.g., Q1 2025)
4. Enter the **Month Names** (e.g., Jan–Mar 2025) — shown on investor dashboards
5. Enter the **ROI %** for that quarter
6. Check **Finalized** once the numbers are confirmed
7. Click **Save**

> Only finalized declarations are used when calculating payout amounts. Do not finalize until the ROI is confirmed.

---

## 6. Payouts

Payouts represent the actual money disbursed to investors for a quarter.

**Path:** Admin → Payouts

### Processing a Payout

1. Go to **Payouts** and click **Add Payout**
2. Select the **Investor**
3. Select the **Declaration** (pool + quarter) this payout is for
4. The **Gross Amount** is auto-calculated based on the investor's capital and the declared ROI %
5. Review and adjust if needed:
   - Emergency Fund Deduction (%)
   - TDS Deduction (%)
   - FD Returns (if applicable)
   - Months Considered
6. The **Net Payable Amount** is shown automatically
7. Enter:
   - Payment Date
   - Payment Reference (UTR / transaction ID)
   - Receipt URL (if available)
8. Click **Save**

### Marking TDS as Filed

Once TDS is filed with the government for a quarter:

1. Find the payout in the list
2. Click **Edit**
3. Toggle **TDS Filed** to on
4. Click **Save**

### Exporting Payout Records

- Click **Export CSV** to download all payout data for reconciliation or audits

---

## 7. Loans

Track loans disbursed from or related to the business.

**Path:** Admin → Loans

### Adding a Loan

1. Go to **Loans** and click **Add Loan**
2. Fill in:
   - Borrower name
   - Loan type (Hand Loan, Term Loan, Working Capital Loan, Business Loan, Other)
   - Principal amount
   - Interest rate (% per annum)
   - Tenure (in months)
   - Disbursal date
   - Associated pool (optional)
3. Click **Save**
4. The system automatically generates the full EMI schedule using the reducing-balance method

### Marking an EMI as Paid

1. Find the loan and click the **EMI Schedule** icon (drawer opens)
2. Locate the EMI due for the current period
3. Click **Mark Paid**
4. Enter the payment reference and actual paid date
5. Click **Confirm**

> Overdue EMIs (past due date, unpaid) are highlighted in red automatically.

### Closing a Loan

1. Find the loan and click **Edit**
2. Change the status to **Closed**
3. Click **Save**

---

## 8. Email Broadcasts

Send email announcements to investors — payout notices, new opportunities, updates.

**Path:** Admin → Broadcasts

### Sending a Broadcast

1. Go to **Broadcasts** and click **Compose**
2. Set the **Subject**
3. Write the **Email Body** (HTML supported)
4. To add an image: click **Upload Image**, select the file — it gets embedded inline
5. Select **Recipients:**
   - All Investors
   - Active Investors only
   - Exited Investors only
   - By Pool (select a specific pool)
   - Specific Emails (comma-separated for external contacts)
6. Click **Preview Recipients** to see who will receive the email
7. Click **Send**
8. A confirmation shows the sent/failed count

### Viewing Broadcast History

- The bottom of the Broadcasts page shows the last 50 broadcasts with subject, recipients, sent count, and date
- Click a row to expand and see full details

---

## 9. Opportunities

Manage the investment opportunities shown on the public website and investor dashboard.

**Path:** Admin → Opportunities

### Editing an Opportunity

1. Go to **Opportunities**
2. Find the opportunity and click **Edit**
3. Editable fields:
   - Title, tagline, description
   - Minimum investment amount
   - Target IRR
   - Tenure
   - Total pool size
   - Status: **Active** / **Coming Soon** / **Closed**
   - Volatility level: Low / Medium / High
   - Volatility note
   - Image URL
   - Detail URL (link to the opportunity's detail page)
   - Visibility toggles (public / investor-only)
4. Click **Save**

> The detail page content (hero metrics, highlights, deal terms) is managed in the codebase, not here. Only listing metadata is editable from this panel.

### Changing an Opportunity Status

- **Active** — visible on public site with live badge, investors can express interest
- **Coming Soon** — visible with a coming soon badge, no investment action
- **Closed** — hidden from public listing

---

## 10. Opportunity Categories

Categories group opportunities (Transportation, Hospitality, F&B, Debt Funds).

**Path:** Admin → Opportunity Categories

### Editing a Category

1. Go to **Opportunity Categories**
2. Click **Edit** on a category
3. Update:
   - Name and slug
   - Description
   - Image URL (thumbnail shown on the public categories page)
   - Volatility level (Low / Medium / High)
   - Active toggle
4. Click **Save**

---

## 11. Referral Interest

View investors who signed up for early access to the referral program.

**Path:** Admin → Referral Interest

- Table shows investor name, email, phone, and sign-up date
- Click **Export CSV** to download the list
- Use this list to follow up with interested investors about the referral launch

---

## 12. System Logs

**Path:** Admin → Logs

- Shows a chronological log of all significant system events (investor creation, payouts, broadcasts, errors)
- Use this to audit actions or debug issues
- Logs are read-only — no actions available here

---

## Monthly Ops Checklist

Use this as a recurring checklist each month:

- [ ] Review and action any **pending investor applications**
- [ ] Check **Loans** for any overdue EMIs (highlighted in red)
- [ ] Create **ROI Declarations** for the quarter closing this month
- [ ] Process **Payouts** for all investors in the declared pools
- [ ] Send a **Broadcast** to investors confirming their payout amount and date
- [ ] Export payout CSV for accounting/TDS records
- [ ] Mark **TDS as Filed** for the relevant quarter once submitted

---

## Common Issues

| Issue | What to do |
|---|---|
| Investor did not receive welcome email | Go to Investors → find investor → resend credentials is not available in UI; contact developer to resend manually |
| Payout amount looks wrong | Check the Declaration ROI % and the investor's total investment amount — both feed into the auto-calculation |
| Investor cannot log in | Verify their email in Investors table matches what they are using to log in |
| EMI reminder not sent | Check Logs for cron errors; contact developer |
| Broadcast shows 0 sent | Check recipient filter — "By Pool" requires the correct pool to be selected |

---

*For technical issues, contact the development team. This guide covers UI-level operations only.*
