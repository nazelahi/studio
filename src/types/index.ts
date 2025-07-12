

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

    
