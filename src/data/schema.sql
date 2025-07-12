
-- Create the tenants table to store tenant information.
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  property text NOT NULL,
  rent numeric NOT NULL,
  joinDate date NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'Pending'::text, -- Paid, Pending, Overdue
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Create the expenses table to track property-related expenses.
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Due'::text, -- Paid, Due
  created_at timestamptz DEFAULT now()
);

-- Create the rent_entries table to track monthly rent payments.
CREATE TABLE IF NOT EXISTS public.rent_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenantId uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  property text NOT NULL,
  rent numeric NOT NULL,
  dueDate date NOT NULL,
  status text NOT NULL DEFAULT 'Pending'::text, -- Paid, Pending, Overdue
  avatar text,
  year smallint NOT NULL,
  month smallint NOT NULL,
  paymentDate date,
  collectedBy text,
  created_at timestamptz DEFAULT now()
);

-- Create the table to hold property settings.
-- It's designed to hold only a single row for your property.
CREATE TABLE IF NOT EXISTS public.property_settings (
  id smallint PRIMARY KEY DEFAULT 1,
  house_name text,
  house_address text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT single_row_check CHECK (id = 1)
);


-- Insert a default row so that our app can update it.
INSERT INTO public.property_settings (id, house_name, house_address)
VALUES (1, 'Sunset Apartments', '123 Ocean View Drive, Miami, FL 33139')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_settings ENABLE ROW LEVEL SECURITY;

-- Policies for tenants table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tenants;
CREATE POLICY "Enable read access for authenticated users" ON public.tenants
  FOR SELECT USING (auth.role() = 'authenticated');
  
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tenants;
CREATE POLICY "Enable insert for authenticated users" ON public.tenants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.tenants;
CREATE POLICY "Enable update for authenticated users" ON public.tenants
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.tenants;
CREATE POLICY "Enable delete for authenticated users" ON public.tenants
  FOR DELETE USING (auth.role() = 'authenticated');


-- Policies for expenses table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.expenses;
CREATE POLICY "Enable read access for authenticated users" ON public.expenses
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.expenses;
CREATE POLICY "Enable insert for authenticated users" ON public.expenses
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.expenses;
CREATE POLICY "Enable update for authenticated users" ON public.expenses
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.expenses;
CREATE POLICY "Enable delete for authenticated users" ON public.expenses
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for rent_entries table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.rent_entries;
CREATE POLICY "Enable read access for authenticated users" ON public.rent_entries
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.rent_entries;
CREATE POLICY "Enable insert for authenticated users" ON public.rent_entries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.rent_entries;
CREATE POLICY "Enable update for authenticated users" ON public.rent_entries
  FOR UPDATE USING (auth.role() = 'authenticated');
  
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.rent_entries;
CREATE POLICY "Enable delete for authenticated users" ON public.rent_entries
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for property_settings table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.property_settings;
CREATE POLICY "Enable read access for all users" ON public.property_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.property_settings;
CREATE POLICY "Enable update for authenticated users" ON public.property_settings
  FOR UPDATE USING (auth.role() = 'authenticated');
