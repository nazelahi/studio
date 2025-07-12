


export type Tenant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  property: string;
  rent: number;
  joinDate: string;
  notes?: string;
  status: "Paid" | "Active" | "Overdue";
  avatar: string;
  type?: string;
  documents?: string[];
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
    tenantId: string;
    name: string;
    property: string; // "Flat" in the new design
    rent: number; // "Amount"
    dueDate: string; 
    status: "Paid" | "Pending" | "Overdue";
    avatar: string;
    year: number;
    month: number; // "Month" as an index
    paymentDate?: string; // "Date" of collection
    collectedBy?: string;
    created_at?: string;
}

export type PropertySettings = {
  id: number;
  house_name: string;
  house_address: string;
  bank_name: string;
  bank_account_number: string;
  zakat_bank_name?: string;
  zakat_bank_account_number?: string;
  house_images?: string[];
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
    