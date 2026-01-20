import React, { useEffect, useState } from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Lightbulb, 
  Plus, 
  Trash2, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import type { Transaction, Financials, TransactionCategory } from '../types';
import { TransactionService } from '../services/transactionService';
import { InsightService } from '../services/insightService';
import { cn, formatCurrency } from '../lib/utils';

// --- Validation Schema ---
const transactionSchema = z.object({
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().min(0.01, "Amount must be positive"),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, "Category is required"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState<TransactionFormData>({
    description: '',
    amount: 0,
    type: 'expense',
    category: 'Food',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({});

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  // Update insights whenever transactions change
  useEffect(() => {
    setInsights(InsightService.generateInsights(transactions));
  }, [transactions]);

  const loadData = () => {
    const data = TransactionService.getAll();
    setTransactions(data);
    setLoading(false);
  };

  const calculateFinancials = (): Financials => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof TransactionFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const result = transactionSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: any = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors.");
      return;
    }

    try {
      TransactionService.add({
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category as TransactionCategory,
        date: new Date().toISOString(),
      });
      
      toast.success("Transaction added successfully");
      setFormData({ description: '', amount: 0, type: 'expense', category: 'Food' }); // Reset form
      loadData(); // Refresh list
    } catch (err) {
      toast.error("Failed to add transaction");
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
        TransactionService.delete(id);
        toast.success("Transaction deleted");
        loadData();
    }
  };

  const financials = calculateFinancials();

  // Chart Data
  const categoryData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], t) => {
      const existing = acc.find(c => c.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name: t.category, value: t.amount });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value); // Sort largest expenses first

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* Sidebar / Desktop */}
      <aside className="w-80 bg-white border-r border-slate-200 p-6 hidden md:flex flex-col shadow-sm z-10">
        <div className="flex items-center gap-3 mb-10 text-indigo-600">
          <div className="p-2 bg-indigo-100 rounded-lg">
             <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">WealthWise</h1>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100 mb-6">
          <div className="flex items-center gap-2 text-indigo-700 font-semibold mb-4">
            <Lightbulb size={20} />
            <span>Smart Insights</span>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="text-sm text-slate-700 bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-indigo-50/50 leading-relaxed">
                {insight}
              </div>
            ))}
            {insights.length === 0 && <p className="text-sm text-slate-500 italic">Add more data to generate insights.</p>}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 text-slate-500 text-sm">
                <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                Serverless Mode Active
            </div>
            <p className="text-xs text-slate-400 mt-2">v2.0.0 • Local Persistence</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
                <p className="text-slate-500 mt-1">Track your wealth in real-time.</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 text-sm font-medium text-slate-600">
                 <Activity size={16} className="text-indigo-500" />
                 <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={80} className="text-slate-900"/>
                </div>
                <p className="text-sm font-medium text-slate-500 mb-2">Total Balance</p>
                <h3 className={cn("text-4xl font-bold tracking-tight", financials.balance >= 0 ? "text-slate-800" : "text-rose-600")}>
                    {formatCurrency(financials.balance)}
                </h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden">
                 <div className="absolute right-6 top-6 p-2 bg-emerald-50 text-emerald-600 rounded-full">
                    <TrendingUp size={20} />
                 </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Income</p>
                <h3 className="text-2xl font-bold text-emerald-600 flex items-center gap-1">
                    <ArrowUpRight size={24} />
                    {formatCurrency(financials.income)}
                </h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-6 top-6 p-2 bg-rose-50 text-rose-600 rounded-full">
                    <TrendingDown size={20} />
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
                <h3 className="text-2xl font-bold text-rose-600 flex items-center gap-1">
                    <ArrowDownRight size={24} />
                    {formatCurrency(financials.expense)}
                </h3>
            </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Column: Chart & History */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Charts Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-6">Spending Analysis</h3>
                        {categoryData.length > 0 ? (
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-72 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <Activity size={32} className="mb-2 opacity-50"/>
                                <p>No expenses recorded yet.</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Transactions Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
                            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{transactions.length} Records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4 pl-6">Description</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                                            No transactions found. Add one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                    <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 pl-6 font-medium text-slate-700">{t.description}</td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className={cn("p-4 font-bold text-right", t.type === 'income' ? 'text-emerald-600' : 'text-slate-700')}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                title="Delete Transaction"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="xl:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Plus size={18} />
                            </div>
                            New Transaction
                        </h3>
                        
                        <form onSubmit={handleAddTransaction} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={cn(
                                        "w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                        errors.description ? "border-rose-300 focus:border-rose-500" : "border-slate-200"
                                    )}
                                    placeholder="e.g., Grocery Shopping"
                                />
                                {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                        <input
                                            type="number"
                                            name="amount"
                                            step="0.01"
                                            value={formData.amount || ''}
                                            onChange={handleInputChange}
                                            className={cn(
                                                "w-full pl-7 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all",
                                                errors.amount ? "border-rose-300 focus:border-rose-500" : "border-slate-200"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="Food">Food 🍔</option>
                                    <option value="Housing">Housing 🏠</option>
                                    <option value="Transport">Transport 🚗</option>
                                    <option value="Utilities">Utilities 💡</option>
                                    <option value="Entertainment">Entertainment 🎬</option>
                                    <option value="Salary">Salary 💰</option>
                                    <option value="Freelance">Freelance 💻</option>
                                    <option value="Shopping">Shopping 🛍️</option>
                                    <option value="Health">Health 🏥</option>
                                    <option value="Other">Other 📦</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <Plus size={20} />
                                Add Transaction
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}