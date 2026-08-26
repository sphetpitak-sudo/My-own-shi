export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "in_progress" | "done";
export type Recurring = "none" | "daily" | "weekly" | "monthly";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

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
  priority: Priority;
  status: Status;
  estimated_minutes: number | null;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
  recurring: Recurring;
  actual_minutes: number | null;
  tags: string[];
}
