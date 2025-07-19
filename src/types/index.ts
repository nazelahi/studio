

import type { toast } from "@/hooks/use-toast";

export type ToastFn = typeof toast;

export type TabNames = {
  overview: string;
  tenants: string;
  work: string;
  reports: string;
  zakat: string;
  documents: string;
};

export type Document = {
  id: string;
  created_at: string;
  file_name: string;
  file_url: string;
  file_type: string;
  category: string;
  description?: string;
  isTenantDoc?: boolean;
};

export type Tenant = {
  id:string;
  name: string;
  email: string;
  phone?: string;
  property: string;
  rent: number;
  join_date: string;
  notes?: string;
  status: "Paid" | "Active" | "Overdue" | "Archived";
  avatar: string;
  type?: string;
  documents?: string[];
  father_name?: string;
  address?: string;
  date_of_birth?: string;
  nid_number?: string;
  advance_deposit?: number;
  gas_meter_number?: string;
  electric_meter_number?: string;
  created_at?: string;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  status: "Paid" | "Due";
  created_at?: string;
};

export type RentEntry = {
    id: string;
    tenant_id: string;
    name: string;
    property: string; // "Flat" in the new design
    rent: number; // "Amount"
    due_date: string; 
    status: "Paid" | "Pending" | "Overdue";
    avatar: string;
    year: number;
    month: number; // "Month" as an index
    payment_date?: string; // "Date" of collection
    collected_by?: string;
    payment_for_month?: number;
    created_at?: string;
}

export type PageLabels = {
  page_dashboard: {
    nav_dashboard: string;
    nav_settings: string;
  };
  tabNames: TabNames;
};

export type PropertySettings = {
  id: number;
  house_name: string;
  house_address: string;
  bank_name: string;
  bank_account_number: string;
  bank_logo_url?: string;
  owner_name?: string;
  owner_photo_url?: string;
  passcode?: string;
  passcode_protection_enabled?: boolean;
  about_us?: string;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  footer_name?: string;
  theme_primary?: string;
  theme_table_header_background?: string;
  theme_table_header_foreground?: string;
  theme_table_footer_background?: string;
  theme_mobile_nav_background?: string;
  theme_mobile_nav_foreground?: string;
  theme_primary_dark?: string;
  theme_table_header_background_dark?: string;
  theme_table_header_foreground_dark?: string;
  theme_table_footer_background_dark?: string;
  theme_mobile_nav_background_dark?: string;
  theme_mobile_nav_foreground_dark?: string;
  whatsapp_reminders_enabled?: boolean;
  whatsapp_reminder_schedule?: string[];
  whatsapp_reminder_template?: string;
  tenant_view_style?: 'grid' | 'list';
  metadata_title?: string;
  favicon_url?: string;
  app_logo_url?: string;
  document_categories?: string[];
  date_format?: string;
  currency_symbol?: string;
  page_labels?: PageLabels;
};

export type ZakatBankDetail = {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder?: string;
  logo_url?: string;
  location?: string;
  created_at?: string;
};

export type Deposit = {
  id: string;
  year: number;
  month: number;
  amount: number;
  deposit_date: string;
  receipt_url?: string;
  created_at?: string;
}

export type ZakatTransaction = {
  id: string;
  transaction_date: string;
  type: 'inflow' | 'outflow';
  amount: number;
  source_or_recipient: string;
  description?: string;
  receipt_url?: string;
  created_at?: string;
}

export type Notice = {
  id: string;
  year: number;
  month: number;
  content: string;
  created_at?: string;
}

export type WorkDetail = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  assigned_to_id?: string;
  product_cost?: number;
  worker_cost?: number;
  due_date?: string;
  created_at?: string;
};
