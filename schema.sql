-- RentFlow - Complete Database Schema

-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema "public";

-- Table for storing property settings. Only one row will exist.
create table if not exists public.property_settings (
  id bigint primary key generated always as identity,
  house_name text not null default 'RentFlow'::text,
  house_address text,
  bank_name text,
  bank_account_number text,
  bank_logo_url text,
  owner_name text,
  owner_photo_url text,
  passcode text,
  passcode_protection_enabled boolean default true,
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
  whatsapp_reminders_enabled boolean default false,
  whatsapp_reminder_schedule text[],
  whatsapp_reminder_template text,
  tenant_view_style public.character varying(255) COLLATE "default" DEFAULT 'grid'::character varying,
  metadata_title text,
  favicon_url text,
  app_logo_url text,
  document_categories text[],
  date_format text,
  currency_symbol text,
  page_labels jsonb
);
-- Ensure only one row can be created
alter table public.property_settings add constraint unique_id_for_singleton check (id = 1);

-- Table for tenants
create table if not exists public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  phone text,
  property text not null,
  rent numeric not null,
  join_date date not null,
  notes text,
  status public.character varying(255) COLLATE "default",
  avatar text,
  "type" text,
  documents text[],
  father_name text,
  address text,
  date_of_birth date,
  nid_number text,
  advance_deposit numeric,
  gas_meter_number text,
  electric_meter_number text,
  created_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Table for rent entries
create table if not exists public.rent_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text,
  property text,
  rent numeric,
  due_date date,
  status public.character varying(255) COLLATE "default",
  avatar text,
  "year" smallint,
  "month" smallint,
  payment_date date,
  collected_by text,
  payment_for_month smallint,
  created_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Table for expenses
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  category text not null,
  amount numeric not null,
  description text,
  status public.character varying(255) COLLATE "default",
  created_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Table for deposits
create table if not exists public.deposits (
  id uuid primary key default uuid_generate_v4(),
  year smallint not null,
  month smallint not null,
  amount numeric not null,
  deposit_date date not null,
  receipt_url text,
  created_at timestamp with time zone not null default now()
);

-- Table for general documents
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  file_name text,
  file_url text,
  file_type text,
  category text,
  description text,
  created_at timestamp with time zone not null default now()
);

-- Table for notices
create table if not exists public.notices (
  id uuid primary key default uuid_generate_v4(),
  year smallint not null,
  month smallint not null,
  content text,
  created_at timestamp with time zone not null default now()
);

-- Table for work details
create table if not exists public.work_details (
  id uuid primary key default uuid_generate_v4(),
  title text,
  description text,
  category text,
  status public.character varying(255) COLLATE "default",
  assigned_to_id uuid,
  product_cost numeric,
  worker_cost numeric,
  due_date date,
  created_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone
);

-- Table for Zakat bank details
create table if not exists public.zakat_bank_details (
  id uuid primary key default uuid_generate_v4(),
  bank_name text not null,
  account_number text not null,
  account_holder text,
  logo_url text,
  location text,
  created_at timestamp with time zone not null default now()
);

-- Table for Zakat transactions
create table if not exists public.zakat_transactions (
  id uuid primary key default uuid_generate_v4(),
  transaction_date date not null,
  "type" public.character varying(255) COLLATE "default",
  amount numeric not null,
  source_or_recipient text,
  description text,
  receipt_url text,
  created_at timestamp with time zone not null default now()
);

-- Set up row-level security (RLS) policies if desired. 
-- By default, tables are protected. You need to enable RLS and create policies.
-- Example for a public table:
-- alter table public.property_settings enable row level security;
-- create policy "Allow public read-only access" on public.property_settings for select using (true);

-- Example for a protected table (users must be authenticated):
-- alter table public.tenants enable row level security;
-- create policy "Allow individual access" on public.tenants for all using (auth.role() = 'authenticated');


-- Insert the single settings row
insert into public.property_settings (id) values (1) on conflict (id) do nothing;
