-- ============================================================
-- loans
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loans (
  loan_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id       UUID REFERENCES public.company_pools(purchase_id) ON DELETE SET NULL,
  borrower_name TEXT NOT NULL,
  loan_type     TEXT NOT NULL DEFAULT 'Hand Loan',
  -- e.g. 'Hand Loan', 'Term Loan', 'Working Capital Loan', 'Business Loan'
  principal     NUMERIC(14, 2) NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,            -- % per annum
  tenure_months INT NOT NULL,
  disbursal_date DATE NOT NULL,
  maturity_date  DATE,
  status        TEXT NOT NULL DEFAULT 'active',    -- active | closed | defaulted
  notes         TEXT,
  contact_phone TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- loan_emi_payments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.loan_emi_payments (
  emi_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id           UUID NOT NULL REFERENCES public.loans(loan_id) ON DELETE CASCADE,
  emi_number        INT NOT NULL,                  -- 1-based sequence
  due_date          DATE NOT NULL,
  paid_date         DATE,
  emi_amount        NUMERIC(14, 2) NOT NULL,       -- total EMI (principal + interest)
  principal_component NUMERIC(14, 2) NOT NULL,
  interest_component  NUMERIC(14, 2) NOT NULL,
  outstanding_principal NUMERIC(14, 2) NOT NULL,  -- after this EMI
  status            TEXT NOT NULL DEFAULT 'pending', -- pending | paid | overdue
  payment_reference TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (loan_id, emi_number)
);

-- Updated_at trigger for loans
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_loans_updated_at') THEN
    CREATE TRIGGER trg_loans_updated_at
      BEFORE UPDATE ON public.loans
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- RLS: admin-only via service role (no policies needed — service role bypasses RLS)
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_emi_payments ENABLE ROW LEVEL SECURITY;
