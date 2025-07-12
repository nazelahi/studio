-- Full SQL schema for the RentFlow application

-- Drop existing policies to avoid conflicts, if they exist.
-- You might want to be careful with this in a production environment.
DROP POLICY IF EXISTS "Allow all users to view property settings" ON "property_settings";
DROP POLICY IF EXISTS "Allow admin users to update property settings" ON "property_settings";
DROP POLICY IF EXISTS "Allow all users to view work details" ON "work_details";
DROP POLICY IF EXISTS "Allow admin users to manage work details" ON "work_details";
DROP POLICY IF EXISTS "Allow all users to view tenants" ON "tenants";
DROP POLICY IF EXISTS "Allow admin users to manage tenants" ON "tenants";
DROP POLICY IF EXISTS "Allow all users to view expenses" ON "expenses";
DROP POLICY IF EXISTS "Allow admin users to manage expenses" ON "expenses";
DROP POLICY IF EXISTS "Allow all users to view rent entries" ON "rent_entries";
DROP POLICY IF EXISTS "Allow admin users to manage rent entries" ON "rent_entries";
DROP POLICY IF EXISTS "Allow all users to view deposits" ON "deposits";
DROP POLICY IF EXISTS "Allow admin users to manage deposits" ON "deposits";
DROP POLICY IF EXISTS "Allow all users to view notices" ON "notices";
DROP POLICY IF EXISTS "Allow admin users to manage notices" ON "notices";
DROP POLICY IF EXISTS "Allow all users to view zakat transactions" ON "zakat_transactions";
DROP POLICY IF EXISTS "Allow admin users to manage zakat transactions" ON "zakat_transactions";
DROP POLICY IF EXISTS "Allow all users to view zakat bank details" ON "zakat_bank_details";
DROP POLICY IF EXISTS "Allow admin users to manage zakat bank details" ON "zakat_bank_details";


-- Table: property_settings
-- Stores global settings for the property.
CREATE TABLE IF NOT EXISTS public.property_settings (
    id bigint PRIMARY KEY DEFAULT 1,
    house_name text,
    house_address text,
    bank_name text,
    bank_account_number text,
    bank_logo_url text,
    owner_name text,
    owner_photo_url text,
    CONSTRAINT property_settings_id_check CHECK (id = 1)
);
-- Policies for property_settings
ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view property settings" ON public.property_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin users to update property settings" ON public.property_settings FOR UPDATE USING (auth.role() = 'authenticated');


-- Table: work_details
-- Stores details about maintenance and other work.
CREATE TABLE IF NOT EXISTS public.work_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    status text NOT NULL DEFAULT 'To Do'::text,
    assigned_to_id text,
    product_cost numeric,
    worker_cost numeric,
    due_date date
);
-- Policies for work_details
ALTER TABLE public.work_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view work details" ON public.work_details FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage work details" ON public.work_details FOR ALL USING (auth.role() = 'authenticated');


-- Table: tenants
-- Stores tenant information.
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    property text NOT NULL,
    rent numeric NOT NULL,
    join_date date NOT NULL,
    notes text,
    status text DEFAULT 'Active'::text,
    avatar text,
    type text,
    documents text[]
);
-- Policies for tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage tenants" ON public.tenants FOR ALL USING (auth.role() = 'authenticated');


-- Table: expenses
-- Stores property-related expenses.
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    date date NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    description text,
    status text DEFAULT 'Due'::text
);
-- Policies for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage expenses" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');


-- Table: rent_entries
-- Stores monthly rent payment records.
CREATE TABLE IF NOT EXISTS public.rent_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    property text NOT NULL,
    rent numeric NOT NULL,
    due_date date NOT NULL,
    status text DEFAULT 'Pending'::text,
    avatar text,
    year integer NOT NULL,
    month integer NOT NULL,
    payment_date date,
    collected_by text
);
-- Policies for rent_entries
ALTER TABLE public.rent_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view rent entries" ON public.rent_entries FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage rent entries" ON public.rent_entries FOR ALL USING (auth.role() = 'authenticated');


-- Table: deposits
-- Stores bank deposit information.
CREATE TABLE IF NOT EXISTS public.deposits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    amount numeric NOT NULL,
    deposit_date date NOT NULL,
    receipt_url text
);
-- Policies for deposits
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view deposits" ON public.deposits FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage deposits" ON public.deposits FOR ALL USING (auth.role() = 'authenticated');


-- Table: notices
-- Stores monthly notices.
CREATE TABLE IF NOT EXISTS public.notices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    year integer NOT NULL,
    month integer NOT NULL,
    content text NOT NULL
);
-- Policies for notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage notices" ON public.notices FOR ALL USING (auth.role() = 'authenticated');


-- Table: zakat_transactions
-- Stores Zakat inflow and outflow.
CREATE TABLE IF NOT EXISTS public.zakat_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    transaction_date date NOT NULL,
    type text NOT NULL, -- 'inflow' or 'outflow'
    amount numeric NOT NULL,
    source_or_recipient text NOT NULL,
    description text,
    receipt_url text
);
-- Policies for zakat_transactions
ALTER TABLE public.zakat_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view zakat transactions" ON public.zakat_transactions FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage zakat transactions" ON public.zakat_transactions FOR ALL USING (auth.role() = 'authenticated');


-- Table: zakat_bank_details
-- Stores bank account details for Zakat.
CREATE TABLE IF NOT EXISTS public.zakat_bank_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    bank_name text NOT NULL,
    account_number text NOT NULL,
    account_holder text,
    logo_url text,
    location text
);
-- Policies for zakat_bank_details
ALTER TABLE public.zakat_bank_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view zakat bank details" ON public.zakat_bank_details FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage zakat bank details" ON public.zakat_bank_details FOR ALL USING (auth.role() = 'authenticated');
