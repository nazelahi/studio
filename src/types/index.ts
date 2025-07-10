export type Tenant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  property: string;
  rent: number;
  joinDate: string;
  notes?: string;
  dueDate?: string; // This was from previous logic, might need to integrate
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
