export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  | 'Food' 
  | 'Housing' 
  | 'Transport' 
  | 'Entertainment' 
  | 'Salary' 
  | 'Freelance' 
  | 'Shopping'
  | 'Utilities'
  | 'Health'
  | 'Other';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO String
}

export interface Financials {
  income: number;
  expense: number;
  balance: number;
}
