import type { Transaction } from '../types';
import { v4 as uuidv4 } from 'uuid';

const getStorageKey = (userId: string) => `wealthwise_data_${userId}`;

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
  getAll: (userId: string): Transaction[] => {
    const key = getStorageKey(userId);
    const data = localStorage.getItem(key);
    if (!data) {
      // Seed initial data if empty
      const seeded = SEED_DATA.map(t => ({...t, id: uuidv4()})); // unique ids for new users
      localStorage.setItem(key, JSON.stringify(seeded));
      return seeded;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse transactions', e);
      return [];
    }
  },

  add: (userId: string, transaction: Omit<Transaction, 'id'>): Transaction => {
    const transactions = TransactionService.getAll(userId);
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
    };
    const updated = [newTransaction, ...transactions];
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    return newTransaction;
  },

  delete: (userId: string, id: string): void => {
    const transactions = TransactionService.getAll(userId);
    const updated = transactions.filter((t) => t.id !== id);
    localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
  },
  
  clear: (userId: string): void => {
      localStorage.removeItem(getStorageKey(userId));
  }
};