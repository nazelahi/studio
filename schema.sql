-- Add logo and location to Zakat bank details
ALTER TABLE public.zakat_bank_details
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Remove old single-entry zakat fields from property settings
ALTER TABLE public.property_settings
DROP COLUMN IF EXISTS zakat_bank_name,
DROP COLUMN IF EXISTS zakat_account_number;
