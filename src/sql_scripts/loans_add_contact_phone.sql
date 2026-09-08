-- Add contact phone to loans (for WhatsApp EMI reminders)
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS contact_phone TEXT;
