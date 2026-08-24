export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: string;
}
