-- Full Database Schema for RentFlow

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Storage buckets setup
-- Create 'tenant-documents' bucket for public access
insert into storage.buckets (id, name, public)
values ('tenant-documents', 'tenant-documents', true)
on conflict (id) do nothing;

-- Create 'deposit-receipts' bucket for public access
insert into storage.buckets (id, name, public)
values ('deposit-receipts', 'deposit-receipts', true)
on conflict (id) do nothing;

-- Create 'zakat-receipts' bucket for public access
insert into storage.buckets (id, name, public)
values ('zakat-receipts', 'zakat-receipts', true)
on conflict (id) do nothing;

-- Storage policies
-- Allow public access to view files in 'tenant-documents'
create policy "Allow public read access to tenant documents"
on storage.objects for select
using ( bucket_id = 'tenant-documents' );

-- Allow authenticated users to upload/delete their own documents
create policy "Allow authenticated users to upload tenant documents"
on storage.objects for insert
with check ( bucket_id = 'tenant-documents' AND auth.role() = 'authenticated' );

create policy "Allow authenticated users to delete tenant documents"
on storage.objects for delete
using ( bucket_id = 'tenant-documents' AND auth.role() = 'authenticated' );

-- Allow public access to view files in 'deposit-receipts'
create policy "Allow public read access to deposit receipts"
on storage.objects for select
using ( bucket_id = 'deposit-receipts' );

-- Allow authenticated users to upload/delete deposit receipts
create policy "Allow authenticated users to upload deposit receipts"
on storage.objects for insert
with check ( bucket_id = 'deposit-receipts' AND auth.role() = 'authenticated' );

create policy "Allow authenticated users to delete deposit receipts"
on storage.objects for delete
using ( bucket_id = 'deposit-receipts' AND auth.role() = 'authenticated' );

-- Allow public access to view files in 'zakat-receipts'
create policy "Allow public read access to zakat receipts"
on storage.objects for select
using ( bucket_id = 'zakat-receipts' );

-- Allow authenticated users to upload/delete zakat receipts
create policy "Allow authenticated users to upload zakat receipts"
on storage.objects for insert
with check ( bucket_id = 'zakat-receipts' AND auth.role() = 'authenticated' );

create policy "Allow authenticated users to delete zakat receipts"
on storage.objects for delete
using ( bucket_id = 'zakat-receipts' AND auth.role() = 'authenticated' );


-- 1. TENANTS TABLE
create table if not exists public.tenants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    phone text,
    property text not null,
    rent numeric not null,
    join_date date not null,
    notes text,
    status text default 'Active'::text,
    avatar text,
    type text,
    documents text[],
    created_at timestamptz default now()
);

-- RLS policies for tenants
alter table public.tenants enable row level security;

drop policy if exists "Public can view tenants" on public.tenants;
create policy "Public can view tenants" on public.tenants for select using (true);

drop policy if exists "Admins can manage tenants" on public.tenants;
create policy "Admins can manage tenants" on public.tenants for all using (auth.role() = 'authenticated');


-- 2. RENT ENTRIES TABLE
create table if not exists public.rent_entries (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid references public.tenants(id) on delete cascade,
    name text not null,
    property text not null,
    rent numeric not null,
    due_date date not null,
    status text default 'Pending'::text,
    avatar text,
    year integer not null,
    month integer not null,
    payment_date date,
    collected_by text,
    created_at timestamptz default now()
);

-- RLS policies for rent_entries
alter table public.rent_entries enable row level security;

drop policy if exists "Public can view rent entries" on public.rent_entries;
create policy "Public can view rent entries" on public.rent_entries for select using (true);

drop policy if exists "Admins can manage rent entries" on public.rent_entries;
create policy "Admins can manage rent entries" on public.rent_entries for all using (auth.role() = 'authenticated');


-- 3. EXPENSES TABLE
create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    category text not null,
    amount numeric not null,
    description text,
    status text default 'Due'::text,
    created_at timestamptz default now()
);

-- RLS policies for expenses
alter table public.expenses enable row level security;

drop policy if exists "Public can view expenses" on public.expenses;
create policy "Public can view expenses" on public.expenses for select using (true);

drop policy if exists "Admins can manage expenses" on public.expenses;
create policy "Admins can manage expenses" on public.expenses for all using (auth.role() = 'authenticated');


-- 4. DEPOSITS TABLE
create table if not exists public.deposits (
    id uuid primary key default gen_random_uuid(),
    year integer not null,
    month integer not null,
    amount numeric not null,
    deposit_date date not null,
    receipt_url text,
    created_at timestamptz default now()
);

-- RLS policies for deposits
alter table public.deposits enable row level security;

drop policy if exists "Public can view deposits" on public.deposits;
create policy "Public can view deposits" on public.deposits for select using (true);

drop policy if exists "Admins can manage deposits" on public.deposits;
create policy "Admins can manage deposits" on public.deposits for all using (auth.role() = 'authenticated');


-- 5. NOTICES TABLE
create table if not exists public.notices (
    id uuid primary key default gen_random_uuid(),
    year integer not null,
    month integer not null,
    content text not null,
    created_at timestamptz default now()
);

-- RLS policies for notices
alter table public.notices enable row level security;

drop policy if exists "Public can view notices" on public.notices;
create policy "Public can view notices" on public.notices for select using (true);

drop policy if exists "Admins can manage notices" on public.notices;
create policy "Admins can manage notices" on public.notices for all using (auth.role() = 'authenticated');


-- 6. ZAKAT TRANSACTIONS TABLE
create table if not exists public.zakat_transactions (
    id uuid primary key default gen_random_uuid(),
    transaction_date date not null,
    type text not null,
    amount numeric not null,
    source_or_recipient text not null,
    description text,
    receipt_url text,
    created_at timestamptz default now()
);

-- RLS policies for zakat_transactions
alter table public.zakat_transactions enable row level security;

drop policy if exists "Public can view zakat transactions" on public.zakat_transactions;
create policy "Public can view zakat transactions" on public.zakat_transactions for select using (true);

drop policy if exists "Admins can manage zakat transactions" on public.zakat_transactions;
create policy "Admins can manage zakat transactions" on public.zakat_transactions for all using (auth.role() = 'authenticated');


-- 7. ZAKAT BANK DETAILS TABLE
create table if not exists public.zakat_bank_details (
    id uuid primary key default gen_random_uuid(),
    bank_name text not null,
    account_number text not null,
    account_holder text,
    logo_url text,
    location text,
    created_at timestamptz default now()
);

-- RLS policies for zakat_bank_details
alter table public.zakat_bank_details enable row level security;

drop policy if exists "Public can view zakat bank details" on public.zakat_bank_details;
create policy "Public can view zakat bank details" on public.zakat_bank_details for select using (true);

drop policy if exists "Admins can manage zakat bank details" on public.zakat_bank_details;
create policy "Admins can manage zakat bank details" on public.zakat_bank_details for all using (auth.role() = 'authenticated');


-- 8. WORK DETAILS TABLE
create table if not exists public.work_details (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    category text,
    status text default 'To Do'::text,
    assigned_to_id text,
    product_cost numeric,
    worker_cost numeric,
    due_date date,
    created_at timestamptz default now()
);

-- RLS policies for work_details
alter table public.work_details enable row level security;

drop policy if exists "Public can view work details" on public.work_details;
create policy "Public can view work details" on public.work_details for select using (true);

drop policy if exists "Admins can manage work details" on public.work_details;
create policy "Admins can manage work details" on public.work_details for all using (auth.role() = 'authenticated');


-- 9. PROPERTY SETTINGS TABLE
create table if not exists public.property_settings (
    id bigint primary key generated always as identity,
    house_name text not null,
    house_address text not null,
    bank_name text,
    bank_account_number text,
    bank_logo_url text,
    owner_name text,
    owner_photo_url text,
    created_at timestamptz default now()
);

-- RLS policies for property_settings
alter table public.property_settings enable row level security;

drop policy if exists "Public can view property settings" on public.property_settings;
create policy "Public can view property settings" on public.property_settings for select using (true);

drop policy if exists "Admins can update property settings" on public.property_settings;
create policy "Admins can update property settings" on public.property_settings for update using (auth.role() = 'authenticated');

-- Insert a default row for settings if it doesn't exist
insert into public.property_settings (id, house_name, house_address)
values (1, 'My Property', '123 Main Street')
on conflict (id) do nothing;
