export type Tenant = {
  id: string;
  name: string;
  property: string;
  rent: number;
  dueDate: string;
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
