-- ============================================================
-- investors
-- ============================================================
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investor details"
  ON public.investors FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- companies
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- company_pools
-- ============================================================
ALTER TABLE public.company_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pools"
  ON public.company_pools FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- investor_investments
-- ============================================================
ALTER TABLE public.investor_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own investments"
  ON public.investor_investments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investors
      WHERE user_id = auth.uid()
        AND investor_id = investor_investments.investor_id
    )
  );

-- ============================================================
-- investor_pool_summary (view/table — exact columns vary)
-- No SELECT policy needed: not queried by investor dashboard.
-- Admin access via service-role bypasses RLS.
-- ============================================================
ALTER TABLE public.investor_pool_summary ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- investor_quarterly_payments
-- ============================================================
ALTER TABLE public.investor_quarterly_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payouts"
  ON public.investor_quarterly_payments FOR SELECT
  USING (
    investment_id IN (
      SELECT ii.investment_id
      FROM public.investor_investments ii
      JOIN public.investors i ON i.investor_id = ii.investor_id
      WHERE i.user_id = auth.uid()
    )
  );

-- ============================================================
-- investor_transactions
-- ============================================================
ALTER TABLE public.investor_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.investor_transactions FOR SELECT
  USING (
    investment_id IN (
      SELECT ii.investment_id
      FROM public.investor_investments ii
      JOIN public.investors i ON i.investor_id = ii.investor_id
      WHERE i.user_id = auth.uid()
    )
  );

-- ============================================================
-- quarterly_roi_declarations
-- (needed for payout chart quarter labels in dashboard)
-- ============================================================
ALTER TABLE public.quarterly_roi_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read declarations"
  ON public.quarterly_roi_declarations FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- opportunities & opportunity_categories
-- (policies already applied via opportunities.sql)
-- ============================================================
-- ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.opportunity_categories ENABLE ROW LEVEL SECURITY;
-- See: sql_scripts/opportunities.sql for these policies
