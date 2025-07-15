
-- supabase/migrations/0001_initial_indexes.sql
--
-- This file contains a set of optimized indexes for the RentFlow application.
-- Running these commands in your Supabase SQL Editor will significantly improve
-- the performance of common queries, such as fetching monthly data, filtering,
-- and sorting.

-- It's recommended to run these commands once during setup.

-- Indexes for the 'tenants' table
-- Speeds up filtering for active tenants and sorting by creation date.
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON public.tenants (deleted_at);
CREATE INDEX IF NOT EXISTS idx_tenants_created_at ON public.tenants (created_at);

-- Indexes for the 'rent_entries' table
-- Crucial for quickly fetching rent data for a specific year and month,
-- and for looking up entries for a specific tenant.
CREATE INDEX IF NOT EXISTS idx_rent_entries_deleted_at ON public.rent_entries (deleted_at);
CREATE INDEX IF NOT EXISTS idx_rent_entries_year_month ON public.rent_entries (year, month);
CREATE INDEX IF NOT EXISTS idx_rent_entries_tenant_id ON public.rent_entries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_entries_due_date ON public.rent_entries (due_date);


-- Indexes for the 'expenses' table
-- Speeds up fetching expenses for a specific date range.
CREATE INDEX IF NOT EXISTS idx_expenses_deleted_at ON public.expenses (deleted_at);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date);


-- Indexes for the 'deposits' table
-- Optimizes fetching deposits for a given year and month.
CREATE INDEX IF NOT EXISTS idx_deposits_year_month ON public.deposits (year, month);
CREATE INDEX IF NOT EXISTS idx_deposits_date ON public.deposits (deposit_date);


-- Indexes for the 'work_details' table
-- Improves filtering for active work items and sorting by due date.
CREATE INDEX IF NOT EXISTS idx_work_details_deleted_at ON public.work_details (deleted_at);
CREATE INDEX IF NOT EXISTS idx_work_details_due_date ON public.work_details (due_date);


-- Indexes for the 'zakat_transactions' table
-- Speeds up sorting and fetching transactions by date.
CREATE INDEX IF NOT EXISTS idx_zakat_transactions_date ON public.zakat_transactions (transaction_date);


-- Indexes for the 'notices' table
-- Optimizes fetching notices for a specific year and month.
CREATE INDEX IF NOT EXISTS idx_notices_year_month ON public.notices (year, month);
