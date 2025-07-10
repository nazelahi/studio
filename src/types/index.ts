export type Tenant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  property: string;
  rent: number;
  joinDate: string;
  notes?: string;
  status: "Paid" | "Pending" | "Overdue";
  avatar: string;
};

export type Expense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  status: "Reimbursed" | "Pending";
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
}
