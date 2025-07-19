
--
-- Create a new table for tenants
--
CREATE TABLE
  public.tenants (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(255) NULL,
    property character varying(255) NOT NULL,
    rent numeric NOT NULL,
    join_date date NOT NULL,
    notes text NULL,
    status character varying(255) NOT NULL DEFAULT 'Active'::character varying,
    avatar character varying(255) NULL,
    type character varying(255) NULL,
    documents jsonb NULL,
    father_name character varying(255) NULL,
    address text NULL,
    date_of_birth date NULL,
    nid_number character varying(255) NULL,
    advance_deposit numeric NULL,
    gas_meter_number character varying(255) NULL,
    electric_meter_number character varying(255) NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone NULL,
    CONSTRAINT tenants_pkey PRIMARY KEY (id)
  ) tablespace pg_default;

--
-- Create a new table for expenses
--
CREATE TABLE
  public.expenses (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    date date NOT NULL,
    category character varying(255) NOT NULL,
    amount numeric NOT NULL,
    description text NULL,
    status character varying(255) NOT NULL DEFAULT 'Due'::character varying,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone NULL,
    CONSTRAINT expenses_pkey PRIMARY KEY (id)
  ) tablespace pg_default;

--
-- Create a new table for rent entries
--
CREATE TABLE
  public.rent_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    tenant_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    property character varying(255) NOT NULL,
    rent numeric NOT NULL,
    due_date date NOT NULL,
    status character varying(255) NOT NULL DEFAULT 'Pending'::character varying,
    avatar character varying(255) NULL,
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    payment_date date NULL,
    collected_by character varying(255) NULL,
    payment_for_month integer NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone NULL,
    CONSTRAINT rent_entries_pkey PRIMARY KEY (id),
    CONSTRAINT rent_entries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE
  ) tablespace pg_default;

--
-- Create a new table for property settings
--
CREATE TABLE
  public.property_settings (
    id bigint NOT NULL DEFAULT 1,
    house_name varchar(255) NULL,
    house_address varchar(255) NULL,
    bank_name varchar(255) NULL,
    bank_account_number varchar(255) NULL,
    bank_logo_url text NULL,
    owner_name varchar(255) NULL,
    owner_photo_url text NULL,
    passcode varchar(255) NULL,
    passcode_protection_enabled boolean NULL DEFAULT true,
    about_us text NULL,
    contact_phone varchar(255) NULL,
    contact_email varchar(255) NULL,
    contact_address text NULL,
    footer_name varchar(255) NULL,
    theme_primary varchar(255) NULL,
    theme_table_header_background varchar(255) NULL,
    theme_table_header_foreground varchar(255) NULL,
    theme_table_footer_background varchar(255) NULL,
    theme_mobile_nav_background varchar(255) NULL,
    theme_mobile_nav_foreground varchar(255) NULL,
    whatsapp_reminders_enabled boolean NULL DEFAULT false,
    whatsapp_reminder_schedule jsonb NULL,
    whatsapp_reminder_template text NULL,
    tenant_view_style varchar(255) NULL DEFAULT 'grid',
    metadata_title varchar(255) NULL,
    favicon_url text NULL,
    app_logo_url text NULL,
    document_categories jsonb NULL,
    date_format varchar(255) NULL,
    currency_symbol varchar(10) NULL,
    page_labels jsonb NULL,
    theme_primary_dark varchar(255) NULL,
    theme_table_header_background_dark varchar(255) NULL,
    theme_table_header_foreground_dark varchar(255) NULL,
    theme_table_footer_background_dark varchar(255) NULL,
    theme_mobile_nav_background_dark varchar(255) NULL,
    theme_mobile_nav_foreground_dark varchar(255) NULL,
    CONSTRAINT property_settings_pkey PRIMARY KEY (id)
  ) tablespace pg_default;

--
-- Create a new table for bank deposits
--
CREATE TABLE
  public.deposits (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    amount numeric NOT NULL,
    deposit_date date NOT NULL,
    receipt_url text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT deposits_pkey PRIMARY KEY (id)
  ) tablespace pg_default;

--
-- Create a new table for Zakat transactions
--
CREATE TABLE
  public.zakat_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    transaction_date date NOT NULL,
    type character varying(255) NOT NULL,
    amount numeric NOT NULL,
    source_or_recipient character varying(255) NOT NULL,
    description text NULL,
    receipt_url text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT zakat_transactions_pkey PRIMARY KEY (id)
  ) tablespace pg_default;

--
-- Create a new table for notices
--
CREATE TABLE
  public.notices (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    "year" integer NOT NULL,
    "month" integer NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT notices_pkey PRIMARY KEY (id)
  ) tablespace pg_default;

--
-- Create a new table for work details
--
CREATE TABLE
  public.work_details (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    title text NOT NULL,
    description text NULL,
    category character varying(255) NULL,
    status character varying(255) NOT NULL DEFAULT 'To Do'::character varying,
    assigned_to_id uuid NULL,
    product_cost numeric NULL,
    worker_cost numeric NULL,
    due_date date NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    deleted_at timestamp with time zone NULL,
    CONSTRAINT work_details_pkey PRIMARY KEY (id)
  ) tablespace pg_default;

--
-- Create a new table for Zakat bank details
--
CREATE TABLE
  public.zakat_bank_details (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    bank_name character varying(255) NOT NULL,
    account_number character varying(255) NOT NULL,
    account_holder character varying(255) NULL,
    logo_url text NULL,
    location character varying(255) NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT zakat_bank_details_pkey PRIMARY KEY (id)
  ) tablespace pg_default;
  
--
-- Create a new table for general documents
--
CREATE TABLE
  public.documents (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type character varying(255) NOT NULL,
    category character varying(255) NOT NULL,
    description text NULL,
    CONSTRAINT documents_pkey PRIMARY KEY (id)
  ) tablespace pg_default;

--
-- Enable Row Level Security (RLS) for all tables
--
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakat_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Create policies to allow public read access
--
CREATE POLICY "Enable read access for all users" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.rent_entries FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.property_settings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.deposits FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.zakat_transactions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.work_details FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.zakat_bank_details FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.documents FOR SELECT USING (true);

--
-- Create policies to allow authenticated users (admin) to perform all actions
--
CREATE POLICY "Enable all actions for authenticated users" ON public.tenants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.rent_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.property_settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.deposits FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.zakat_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.notices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.work_details FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.zakat_bank_details FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.documents FOR ALL USING (auth.role() = 'authenticated');

--
-- Setup Storage buckets and policies
--
INSERT INTO storage.buckets (id, name, public) VALUES
  ('tenant-documents', 'tenant-documents', true),
  ('deposit-receipts', 'deposit-receipts', true),
  ('zakat-receipts', 'zakat-receipts', true),
  ('general-documents', 'general-documents', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Enable public read access for tenant documents" ON storage.objects FOR SELECT USING (bucket_id = 'tenant-documents');
CREATE POLICY "Enable insert for authenticated users for tenant documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tenant-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users for tenant documents" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'tenant-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users for tenant documents" ON storage.objects FOR DELETE USING (bucket_id = 'tenant-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Enable public read access for deposit receipts" ON storage.objects FOR SELECT USING (bucket_id = 'deposit-receipts');
CREATE POLICY "Enable insert for authenticated users for deposit receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'deposit-receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users for deposit receipts" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'deposit-receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users for deposit receipts" ON storage.objects FOR DELETE USING (bucket_id = 'deposit-receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Enable public read access for zakat receipts" ON storage.objects FOR SELECT USING (bucket_id = 'zakat-receipts');
CREATE POLICY "Enable insert for authenticated users for zakat receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'zakat-receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users for zakat receipts" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'zakat-receipts' AND auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users for zakat receipts" ON storage.objects FOR DELETE USING (bucket_id = 'zakat-receipts' AND auth.role() = 'authenticated');

CREATE POLICY "Enable public read access for general documents" ON storage.objects FOR SELECT USING (bucket_id = 'general-documents');
CREATE POLICY "Enable insert for authenticated users for general documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'general-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users for general documents" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'general-documents' AND auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users for general documents" ON storage.objects FOR DELETE USING (bucket_id = 'general-documents' AND auth.role() = 'authenticated');

-- Insert the default settings row
INSERT INTO public.property_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
