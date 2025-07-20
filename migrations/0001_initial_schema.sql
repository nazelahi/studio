-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the storage bucket for public files
INSERT INTO storage.buckets (id, name, public)
VALUES ('rentflow-public', 'rentflow-public', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for the public bucket to allow public read and authenticated uploads
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'rentflow-public');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'rentflow-public');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'rentflow-public');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'rentflow-public');


-- Create the tenants table
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    email text,
    phone text,
    property text NOT NULL,
    rent numeric NOT NULL,
    join_date date NOT NULL,
    notes text,
    status text DEFAULT 'Active'::text,
    avatar text,
    type text,
    documents jsonb,
    father_name text,
    address text,
    date_of_birth date,
    nid_number text,
    advance_deposit numeric,
    gas_meter_number text,
    electric_meter_number text,
    created_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create the rent_entries table
CREATE TABLE IF NOT EXISTS public.rent_entries (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    property text NOT NULL,
    rent numeric NOT NULL,
    due_date date NOT NULL,
    status text NOT NULL,
    avatar text,
    year integer NOT NULL,
    month integer NOT NULL,
    payment_date date,
    collected_by text,
    payment_for_month integer,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.rent_entries ENABLE ROW LEVEL SECURITY;

-- Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    description text,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create the deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    amount numeric NOT NULL,
    deposit_date date NOT NULL,
    receipt_url text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Create the notices table
CREATE TABLE IF NOT EXISTS public.notices (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    year integer NOT NULL,
    month integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Create the work_details table
CREATE TABLE IF NOT EXISTS public.work_details (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    description text,
    category text,
    status text,
    assigned_to_id uuid,
    product_cost numeric,
    worker_cost numeric,
    due_date date,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.work_details ENABLE ROW LEVEL SECURITY;

-- Create the documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    category text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create the zakat_transactions table
CREATE TABLE IF NOT EXISTS public.zakat_transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_date date NOT NULL,
    type text NOT NULL,
    amount numeric NOT NULL,
    source_or_recipient text NOT NULL,
    description text,
    receipt_url text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.zakat_transactions ENABLE ROW LEVEL SECURITY;

-- Create the zakat_bank_details table
CREATE TABLE IF NOT EXISTS public.zakat_bank_details (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    bank_name text NOT NULL,
    account_number text NOT NULL,
    account_holder text,
    logo_url text,
    location text,
    created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.zakat_bank_details ENABLE ROW LEVEL SECURITY;

-- Create the property_settings table
CREATE TABLE IF NOT EXISTS public.property_settings (
    id integer PRIMARY KEY DEFAULT 1,
    house_name text,
    house_address text,
    bank_name text,
    bank_account_number text,
    bank_logo_url text,
    owner_name text,
    owner_photo_url text,
    passcode text,
    passcode_protection_enabled boolean DEFAULT true,
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
    theme_primary_dark text,
    theme_table_header_background_dark text,
    theme_table_header_foreground_dark text,
    theme_table_footer_background_dark text,
    theme_mobile_nav_background_dark text,
    theme_mobile_nav_foreground_dark text,
    whatsapp_reminders_enabled boolean,
    whatsapp_reminder_schedule text[],
    whatsapp_reminder_template text,
    tenant_view_style text,
    metadata_title text,
    favicon_url text,
    app_logo_url text,
    document_categories text[],
    date_format text,
    currency_symbol text,
    page_labels jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pk_property_settings CHECK (id = 1)
);
ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;

-- Insert a default row into property_settings if it doesn't exist
INSERT INTO public.property_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Policies for tables (Allow all for authenticated users, adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON public.tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.rent_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.deposits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.notices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.work_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.zakat_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.zakat_bank_details FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated users" ON public.property_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
