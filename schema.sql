-- This file contains SQL commands to update your database schema.
-- You can copy and paste these commands into the Supabase SQL Editor to apply them.

-- To add the house_images column to your property_settings table:
-- ALTER TABLE public.property_settings ADD COLUMN house_images text[];

-- To support multiple Zakat bank accounts, run the following commands.
-- This will create a new table for Zakat bank details and remove the old, single-entry columns from the property_settings table.

-- 1. Create the new table to hold multiple Zakat bank details.
CREATE TABLE public.zakat_bank_details (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    bank_name text NOT NULL,
    account_number text NOT NULL,
    account_holder text,
    CONSTRAINT zakat_bank_details_pkey PRIMARY KEY (id)
);

-- Optional: Enable Row Level Security (good practice)
ALTER TABLE public.zakat_bank_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON "public"."zakat_bank_details" FOR SELECT USING (true);
CREATE POLICY "Enable all actions for authenticated users" ON "public"."zakat_bank_details" FOR ALL USING (auth.role() = 'authenticated');


-- 2. (Optional but recommended) If you have existing data in the old columns, this script will move it to the new table.
-- Run this *before* deleting the old columns.
-- INSERT INTO public.zakat_bank_details (bank_name, account_number)
-- SELECT zakat_bank_name, zakat_bank_account_number
-- FROM public.property_settings
-- WHERE zakat_bank_name IS NOT NULL AND zakat_bank_account_number IS NOT NULL;


-- 3. Remove the old, now redundant, columns from the property_settings table.
-- ALTER TABLE public.property_settings DROP COLUMN zakat_bank_name;
-- ALTER TABLE public.property_settings DROP COLUMN zakat_bank_account_number;
