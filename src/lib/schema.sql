-- Run this command in your Supabase SQL Editor to add the bank_logo_url column.

ALTER TABLE public.property_settings
ADD COLUMN bank_logo_url TEXT;
