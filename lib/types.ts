export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface Assignment {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string;
  due_date: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "done";
  created_at: string;
  updated_at: string;
}
