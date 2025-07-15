
-- Enable UUID extension
create extension if not exists "uuid-ossp" with schema "extensions";

-- Tenants Table
create table public.tenants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  phone text,
  property text not null,
  rent numeric(10, 2) not null,
  join_date date not null,
  notes text,
  status text default 'Active'::text,
  avatar text,
  type text,
  documents jsonb,
  father_name text,
  address text,
  date_of_birth date,
  nid_number text,
  advance_deposit numeric(10, 2),
  created_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone
);
comment on table public.tenants is 'Stores information about each tenant.';

-- Expenses Table
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  category text not null,
  amount numeric(10, 2) not null,
  description text,
  status text not null,
  created_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone
);
comment on table public.expenses is 'Tracks all property-related expenses.';

-- Rent Entries Table
create table public.rent_entries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  name text not null,
  property text not null,
  rent numeric(10, 2) not null,
  due_date date not null,
  status text not null,
  avatar text,
  year smallint not null,
  month smallint not null,
  payment_date date,
  collected_by text,
  created_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone
);
comment on table public.rent_entries is 'Monthly rent payment records for each tenant.';
create index idx_rent_entries_tenant_id on public.rent_entries(tenant_id);
create index idx_rent_entries_year_month on public.rent_entries(year, month);


-- Property Settings Table
create table public.property_settings (
  id smallint primary key default 1,
  house_name text not null,
  house_address text not null,
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
  whatsapp_reminders_enabled boolean default false,
  whatsapp_reminder_schedule text[],
  whatsapp_reminder_template text,
  created_at timestamp with time zone default now() not null,
  constraint single_row_check check (id = 1)
);
comment on table public.property_settings is 'Stores global settings for the property.';
insert into public.property_settings (id, house_name, house_address) values (1, 'My Property', '123 Main St');


-- Bank Deposits Table
create table public.deposits (
  id uuid primary key default uuid_generate_v4(),
  year smallint not null,
  month smallint not null,
  amount numeric(10, 2) not null,
  deposit_date date not null,
  receipt_url text,
  created_at timestamp with time zone default now() not null
);
comment on table public.deposits is 'Logs bank deposits made from rental income.';

-- Notices Table
create table public.notices (
  id uuid primary key default uuid_generate_v4(),
  year smallint not null,
  month smallint not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);
comment on table public.notices is 'Stores monthly notices for tenants.';

-- Work Details Table
create table public.work_details (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text,
  status text not null,
  assigned_to_id uuid,
  product_cost numeric(10, 2),
  worker_cost numeric(10, 2),
  due_date date,
  created_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone
);
comment on table public.work_details is 'Tracks maintenance and repair work.';

-- Zakat Bank Details Table
create table public.zakat_bank_details (
  id uuid primary key default uuid_generate_v4(),
  bank_name text not null,
  account_number text not null,
  account_holder text,
  logo_url text,
  location text,
  created_at timestamp with time zone default now() not null
);
comment on table public.zakat_bank_details is 'Stores bank account details for Zakat donations.';

-- Zakat Transactions Table
create table public.zakat_transactions (
  id uuid primary key default uuid_generate_v4(),
  transaction_date date not null,
  type text not null,
  amount numeric(10, 2) not null,
  source_or_recipient text not null,
  description text,
  receipt_url text,
  created_at timestamp with time zone default now() not null
);
comment on table public.zakat_transactions is 'Tracks all Zakat inflows and outflows.';
