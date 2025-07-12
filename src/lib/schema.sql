-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS public.property_settings, public.work_details, public.tenants, public.expenses, public.rent_entries, public.deposits, public.notices, public.zakat_transactions, public.zakat_bank_details CASCADE;

-- Create property_settings table
CREATE TABLE public.property_settings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    house_name text,
    house_address text,
    bank_name text,
    bank_account_number text,
    bank_logo_url text,
    owner_name text,
    owner_photo_url text
);

-- Seed initial property_settings data
INSERT INTO public.property_settings (id, house_name, house_address) VALUES (1, 'My Property', '123 Main St, Anytown, USA');


-- Create work_details table
CREATE TABLE public.work_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    category text,
    status text NOT NULL DEFAULT 'To Do'::text,
    assigned_to_id uuid,
    product_cost numeric,
    worker_cost numeric,
    due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create tenants table
CREATE TABLE public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    documents jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- Create expenses table
CREATE TABLE public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    category text NOT NULL,
    amount numeric NOT NULL,
    description text,
    status text DEFAULT 'Due'::text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create rent_entries table
CREATE TABLE public.rent_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    collected_by text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create deposits table
CREATE TABLE public.deposits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    year integer NOT NULL,
    month integer NOT NULL,
    amount numeric NOT NULL,
    deposit_date date NOT NULL,
    receipt_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create notices table
CREATE TABLE public.notices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    year integer NOT NULL,
    month integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create zakat_transactions table
CREATE TABLE public.zakat_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date date NOT NULL,
    type text NOT NULL,
    amount numeric NOT NULL,
    source_or_recipient text NOT NULL,
    description text,
    receipt_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- Create zakat_bank_details table
CREATE TABLE public.zakat_bank_details (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name text NOT NULL,
    account_number text NOT NULL,
    account_holder text,
    logo_url text,
    location text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- RLS Policies for property_settings
ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read property settings" ON public.property_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin users to update property settings" ON public.property_settings FOR UPDATE USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');


-- RLS Policies for work_details
ALTER TABLE public.work_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read work details" ON public.work_details FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage work details" ON public.work_details FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage tenants" ON public.tenants FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage expenses" ON public.expenses FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for rent_entries
ALTER TABLE public.rent_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read rent entries" ON public.rent_entries FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage rent entries" ON public.rent_entries FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for deposits
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read deposits" ON public.deposits FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage deposits" ON public.deposits FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for notices
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage notices" ON public.notices FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for zakat_transactions
ALTER TABLE public.zakat_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read zakat transactions" ON public.zakat_transactions FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage zakat transactions" ON public.zakat_transactions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for zakat_bank_details
ALTER TABLE public.zakat_bank_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to read zakat bank details" ON public.zakat_bank_details FOR SELECT USING (true);
CREATE POLICY "Allow admin users to manage zakat bank details" ON public.zakat_bank_details FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
