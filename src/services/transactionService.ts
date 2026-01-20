import type { Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'wealthwise_transactions';

const SEED_DATA: Transaction[] = [
  {
    id: uuidv4(),
    description: 'Monthly Salary',
    amount: 5000,
    type: 'income',
    category: 'Salary',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
  {
    id: uuidv4(),
    description: 'Grocery Run',
    amount: 156.40,
    type: 'expense',
    category: 'Food',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(), // 1 day ago
  },
  {
    id: uuidv4(),
    description: 'Electric Bill',
    amount: 120.50,
    type: 'expense',
    category: 'Utilities',
    date: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    description: 'Freelance Design',
    amount: 850.00,
    type: 'income',
    category: 'Freelance',
    date: new Date().toISOString(),
  },
];

export const TransactionService = {
  getAll: (): Transaction[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Seed initial data if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return SEED_DATA;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse transactions', e);
      return [];
    }
  },

  add: (transaction: Omit<Transaction, 'id'>): Transaction => {
    const transactions = TransactionService.getAll();
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
    };
    const updated = [newTransaction, ...transactions];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newTransaction;
  },

  delete: (id: string): void => {
    const transactions = TransactionService.getAll();
    const updated = transactions.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
  
  clear: (): void => {
      localStorage.removeItem(STORAGE_KEY);
  }
};
