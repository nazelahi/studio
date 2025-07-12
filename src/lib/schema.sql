-- Create tenants table
create table
  public.tenants (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    name text not null,
    email text not null,
    phone text null,
    property text not null,
    rent real not null,
    join_date date not null,
    notes text null,
    status text not null,
    avatar text not null,
    type text null,
    documents jsonb null,
    constraint tenants_pkey primary key (id)
  ) tablespace pg_default;

-- RLS policies for tenants
alter table public.tenants enable row level security;
create policy "Enable read access for all users" on public.tenants for select using (true);
create policy "Enable insert for admins" on public.tenants for insert to service_role with check (true);
create policy "Enable update for admins" on public.tenants for update to service_role using (true);
create policy "Enable delete for admins" on public.tenants for delete to service_role using (true);


-- Create expenses table
create table
  public.expenses (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    date date not null,
    category text not null,
    amount real not null,
    description text not null,
    status text not null,
    constraint expenses_pkey primary key (id)
  ) tablespace pg_default;

-- RLS policies for expenses
alter table public.expenses enable row level security;
create policy "Enable read access for all users" on public.expenses for select using (true);
create policy "Enable insert for admins" on public.expenses for insert to service_role with check (true);
create policy "Enable update for admins" on public.expenses for update to service_role using (true);
create policy "Enable delete for admins" on public.expenses for delete to service_role using (true);

-- Create rent_entries table
create table
  public.rent_entries (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    tenant_id uuid null,
    name text not null,
    property text not null,
    rent real not null,
    due_date date not null,
    status text not null,
    avatar text not null,
    year real not null,
    month real not null,
    payment_date date null,
    collected_by text null,
    constraint rent_entries_pkey primary key (id),
    constraint rent_entries_tenant_id_fkey foreign key (tenant_id) references tenants (id) on delete set null
  ) tablespace pg_default;

-- RLS policies for rent_entries
alter table public.rent_entries enable row level security;
create policy "Enable read access for all users" on public.rent_entries for select using (true);
create policy "Enable insert for admins" on public.rent_entries for insert to service_role with check (true);
create policy "Enable update for admins" on public.rent_entries for update to service_role using (true);
create policy "Enable delete for admins" on public.rent_entries for delete to service_role using (true);


-- Create deposits table
create table
  public.deposits (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    year real not null,
    month real not null,
    amount real not null,
    deposit_date date not null,
    receipt_url text null,
    constraint deposits_pkey primary key (id),
    constraint deposits_year_month_key unique (year, month)
  ) tablespace pg_default;

-- RLS policies for deposits
alter table public.deposits enable row level security;
create policy "Enable read access for all users" on public.deposits for select using (true);
create policy "Enable insert for admins" on public.deposits for insert to service_role with check (true);
create policy "Enable update for admins" on public.deposits for update to service_role using (true);
create policy "Enable delete for admins" on public.deposits for delete to service_role using (true);


-- Create notices table
create table
  public.notices (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    year real not null,
    month real not null,
    content text not null,
    constraint notices_pkey primary key (id),
    constraint notices_year_month_key unique (year, month)
  ) tablespace pg_default;
  
-- RLS policies for notices
alter table public.notices enable row level security;
create policy "Enable read access for all users" on public.notices for select using (true);
create policy "Enable insert for admins" on public.notices for insert to service_role with check (true);
create policy "Enable update for admins" on public.notices for update to service_role using (true);
create policy "Enable delete for admins" on public.notices for delete to service_role using (true);


-- Create zakat_transactions table
create table
  public.zakat_transactions (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    transaction_date date not null,
    type text not null,
    amount real not null,
    source_or_recipient text not null,
    description text null,
    receipt_url text null,
    constraint zakat_transactions_pkey primary key (id)
  ) tablespace pg_default;

-- RLS policies for zakat_transactions
alter table public.zakat_transactions enable row level security;
create policy "Enable read access for all users" on public.zakat_transactions for select using (true);
create policy "Enable all actions for admins" on public.zakat_transactions for all to service_role using (true) with check (true);


-- Create zakat_bank_details table
create table
  public.zakat_bank_details (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    bank_name text not null,
    account_number text not null,
    account_holder text null,
    logo_url text null,
    location text null,
    constraint zakat_bank_details_pkey primary key (id)
  ) tablespace pg_default;
  
-- RLS policies for zakat_bank_details
alter table public.zakat_bank_details enable row level security;
create policy "Enable read access for all users" on public.zakat_bank_details for select using (true);
create policy "Enable all actions for admins" on public.zakat_bank_details for all to service_role using (true) with check (true);


-- Create property_settings table
create table
  public.property_settings (
    id bigint generated by default as identity,
    created_at timestamp with time zone not null default now(),
    house_name text null,
    house_address text null,
    bank_name text null,
    bank_account_number text null,
    bank_logo_url text null,
    owner_name text null,
    owner_photo_url text null,
    constraint property_settings_pkey primary key (id)
  ) tablespace pg_default;
  
-- RLS policies for property_settings
alter table public.property_settings enable row level security;
create policy "Enable read access for all users" on public.property_settings for select using (true);
create policy "Enable update for admins" on public.property_settings for update to service_role using (true);
-- Note: Insert and Delete are typically not needed for a single settings row. 
-- You can create one row manually in the Supabase Studio.

-- Create work_details table
create table
  public.work_details (
    id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    title text not null,
    description text null,
    category text null,
    status text not null,
    assigned_to_id text null,
    product_cost real null,
    worker_cost real null,
    due_date date null,
    constraint work_details_pkey primary key (id)
  ) tablespace pg_default;
  
-- RLS policies for work_details
alter table public.work_details enable row level security;
create policy "Enable read access for all users" on public.work_details for select using (true);
create policy "Enable all actions for admins" on public.work_details for all to service_role using (true) with check (true);