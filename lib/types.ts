export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
}

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  due_date: string | null;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  color: string;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  skip_weekends: boolean;
  next_date: string;
  active: boolean;
  created_at: string;
}