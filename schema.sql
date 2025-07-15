-- Enable Row-Level Security (RLS) on all tables by default.
-- This is a good security practice. You can define policies later.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated, service_role;

-- TENANTS Table
-- Stores information about each tenant.
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    property text NOT NULL,
    rent numeric NOT NULL,
    join_date date NOT NULL,
    notes text,
    status text DEFAULT 'Active'::text,
    avatar text,
    "type" text,
    documents text[],
    father_name text,
    address text,
    date_of_birth date,
    nid_number text,
    advance_deposit numeric,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- RENT_ENTRIES Table
-- Tracks monthly rent payments for each tenant.
CREATE TABLE IF NOT EXISTS public.rent_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
    name text NOT NULL,
    property text NOT NULL,
    rent numeric NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'Pending'::text,
    avatar text,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    payment_date date,
    collected_by text,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
CREATE INDEX rent_entries_tenant_id_idx ON public.rent_entries(tenant_id);
CREATE INDEX rent_entries_year_month_idx ON public.rent_entries(year, month);
ALTER TABLE public.rent_entries ENABLE ROW LEVEL SECURITY;

-- EXPENSES Table
-- Stores all property-related expenses.
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'Due'::text,
    created_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- DEPOSITS Table
-- Logs bank deposits made from rental income.
CREATE TABLE IF NOT EXISTS public.deposits (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    amount numeric NOT NULL,
    deposit_date date NOT NULL,
    receipt_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(year, month)
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- NOTICES Table
-- Stores monthly notices for tenants.
CREATE TABLE IF NOT EXISTS public.notices (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(year, month)
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- WORK_DETAILS Table
-- Tracks maintenance and repair jobs.
CREATE TABLE IF NOT EXISTS public.work_details (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text,
    status text NOT NULL DEFAULT 'To Do'::text,
    assigned_to_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
    product_cost numeric,
    worker_cost numeric,
    due_date date,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.work_details ENABLE ROW LEVEL SECURITY;

-- ZAKAT_BANK_DETAILS Table
-- Stores bank account information for Zakat.
CREATE TABLE IF NOT EXISTS public.zakat_bank_details (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_name text NOT NULL,
    account_number text NOT NULL,
    account_holder text,
    logo_url text,
    location text,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.zakat_bank_details ENABLE ROW LEVEL SECURITY;

-- ZAKAT_TRANSACTIONS Table
-- Tracks Zakat inflows and outflows.
CREATE TABLE IF NOT EXISTS public.zakat_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_date date NOT NULL,
    "type" text NOT NULL,
    amount numeric NOT NULL,
    source_or_recipient text NOT NULL,
    description text,
    receipt_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.zakat_transactions ENABLE ROW LEVEL SECURITY;

-- PROPERTY_SETTINGS Table
-- Stores global settings for the property.
CREATE TABLE IF NOT EXISTS public.property_settings (
    id bigint NOT NULL PRIMARY KEY,
    house_name text,
    house_address text,
    bank_name text,
    bank_account_number text,
    bank_logo_url text,
    owner_name text,
    owner_photo_url text,
    passcode text,
    about_us text,
    contact_phone text,
    contact_email text,
    contact_address text,
    footer_name text,
    theme_primary text,
    theme_table_header_background text,
    theme_table_header_foreground text,
    theme_table_footer_background text,
    theme_mobile_nav_background text,
    theme_mobile_nav_foreground text,
    CONSTRAINT property_settings_id_check CHECK ((id = 1))
);
ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;

-- Insert the single row for settings if it doesn't exist.
INSERT INTO public.property_settings (id, house_name, house_address)
VALUES (1, 'My Property', '123 Main St')
ON CONFLICT (id) DO NOTHING;

-- STORAGE BUCKETS
-- Setup file storage buckets for documents and receipts.
-- Note: You may need to run these from the Supabase dashboard UI if policies fail via SQL.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('tenant-documents', 'tenant-documents', true, 5242880, '{"image/*", "application/pdf"}'),
    ('deposit-receipts', 'deposit-receipts', true, 5242880, '{"image/*"}'),
    ('zakat-receipts', 'zakat-receipts', true, 5242880, '{"image/*"}')
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES for storage buckets
-- These policies allow public access to files within these buckets.
CREATE POLICY "Public read access for tenant documents" ON storage.objects FOR SELECT USING ( bucket_id = 'tenant-documents' );
CREATE POLICY "Public read access for deposit receipts" ON storage.objects FOR SELECT USING ( bucket_id = 'deposit-receipts' );
CREATE POLICY "Public read access for zakat receipts" ON storage.objects FOR SELECT USING ( bucket_id = 'zakat-receipts' );
CREATE POLICY "Allow authenticated uploads for tenant documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'tenant-documents' );
CREATE POLICY "Allow authenticated uploads for deposit receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'deposit-receipts' );
CREATE POLICY "Allow authenticated uploads for zakat receipts" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'zakat-receipts' );

-- General RLS POLICIES for tables
-- These allow authenticated users to perform all actions.
-- For production, you might want more restrictive policies.
CREATE POLICY "Enable all actions for authenticated users" ON public.tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.rent_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.deposits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.notices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.work_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.zakat_bank_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.zakat_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all actions for authenticated users" ON public.property_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
