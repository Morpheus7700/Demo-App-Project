import React, { useEffect, useState } from 'react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import {   DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Lightbulb,
  Plus,
  Trash2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  LogOut,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import type { Transaction, Financials, TransactionCategory } from '../types';
import { TransactionService } from '../services/transactionService';
import { InsightService } from '../services/insightService';
import { cn, formatCurrency } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

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
  const { user, logout } = useAuth();
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
    if (user) {
        loadData();
    }
  }, [user]);

  // Update insights whenever transactions change
  useEffect(() => {
    setInsights(InsightService.generateInsights(transactions));
  }, [transactions]);

  const loadData = () => {
    if (!user) return;
    const data = TransactionService.getAll(user.id);
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
    if (!user) return;
    
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
      TransactionService.add(user.id, {
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
    if (!user) return;
    if (window.confirm("Are you sure you want to delete this transaction?")) {
        TransactionService.delete(user.id, id);
        toast.success("Transaction deleted");
        loadData();
    }
  };
  
  const handleExportCSV = () => {
      const headers = ['ID', 'Description', 'Amount', 'Type', 'Category', 'Date'];
      
      const rows = transactions.map(t => {
          // Escape quotes by replacing " with ""
          const safeDescription = t.description.split('"').join('""');
          return [
              t.id,
              `"${safeDescription}"`, // Wrap description in quotes
              t.amount.toFixed(2),
              t.type,
              t.category,
              t.date
          ];
      });
      
      const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `wealthwise_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
    .sort((a, b) => b.value - a.value);

  // Trend Data Logic
  const trendData = (() => {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (29 - i));
          return d.toISOString().split('T')[0];
      });

      let runningBalance = 0;
      // Calculate initial balance prior to 30 days ago (simplified for demo: starts at 0 or matches first trans)
      
      return last30Days.map(date => {
          const dayTransactions = transactions.filter(t => t.date.startsWith(date));
          const dailyIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const dailyExpense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          
          // In a real app, you'd calculate the running balance from the beginning of time. 
          // Here we just show daily net flow or a cumulative if we had full history.
          // Let's show Cumulative Balance for the view.
          runningBalance += (dailyIncome - dailyExpense);

          return {
              date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              balance: runningBalance,
              income: dailyIncome,
              expense: dailyExpense
          };
      });
  })();

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      
      {/* Sidebar / Desktop */}
      <aside className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 hidden md:flex flex-col shadow-sm z-10 transition-colors duration-300">
        <div className="flex items-center gap-3 mb-10 text-indigo-600 dark:text-indigo-400">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
             <Wallet size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">WealthWise</h1>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800/50 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 mb-6">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold mb-4">
            <Lightbulb size={20} />
            <span>Smart Insights</span>
          </div>
          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div key={idx} className="text-sm text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-3 rounded-xl shadow-sm border border-indigo-50/50 dark:border-slate-700 leading-relaxed">
                {insight}
              </div>
            ))}
            {insights.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 italic">Add more data to generate insights.</p>}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        {user?.name.charAt(0)}
                    </div>
                    {user?.name}
                </div>
                <button onClick={logout} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-500 transition-colors rounded-lg" title="Logout">
                    <LogOut size={18} />
                </button>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
                    <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    Online
                </div>
                <ThemeToggle />
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Overview</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Track your wealth in real-time.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="md:hidden">
                    <ThemeToggle />
                </div>
                <button 
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <Download size={16} className="text-indigo-500" />
                    <span>Export CSV</span>
                </button>
                <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-600 dark:text-slate-300">
                    <Activity size={16} className="text-indigo-500 dark:text-indigo-400" />
                    <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={80} className="text-slate-900 dark:text-slate-100"/>
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Total Balance</p>
                <h3 className={cn("text-4xl font-bold tracking-tight", financials.balance >= 0 ? "text-slate-800 dark:text-white" : "text-rose-600 dark:text-rose-400")}>
                    {formatCurrency(financials.balance)}
                </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden transition-colors">
                 <div className="absolute right-6 top-6 p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                    <TrendingUp size={20} />
                 </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Income</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ArrowUpRight size={24} />
                    {formatCurrency(financials.income)}
                </h3>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center relative overflow-hidden transition-colors">
                <div className="absolute right-6 top-6 p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
                    <TrendingDown size={20} />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Expenses</p>
                <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <ArrowDownRight size={24} />
                    {formatCurrency(financials.expense)}
                </h3>
            </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Column: Chart & History */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Area Chart: Trend */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors lg:col-span-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Balance Trend (30 Days)</h3>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis 
                                            dataKey="date" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 12, fill: '#94a3b8'}} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{fontSize: 12, fill: '#94a3b8'}} 
                                            tickFormatter={(value) => `$${value}`}
                                        />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'var(--tooltip-bg)', 
                                                borderRadius: '8px', 
                                                border: 'none', 
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                color: 'var(--tooltip-text)'
                                            }}
                                            formatter={(value: number | undefined) => [formatCurrency(value ?? 0), 'Balance']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="balance" 
                                            stroke="#6366f1" 
                                            strokeWidth={3}
                                            fillOpacity={1} 
                                            fill="url(#colorBalance)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: Spending */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors lg:col-span-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Spending Analysis</h3>
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
                                            contentStyle={{ 
                                                backgroundColor: 'var(--tooltip-bg)', 
                                                borderRadius: '8px', 
                                                border: 'none', 
                                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                color: 'var(--tooltip-text)'
                                            }}
                                            itemStyle={{ color: 'inherit' }}
                                        />
                                        <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                                    </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-72 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Activity size={32} className="mb-2 opacity-50"/>
                                    <p>No expenses recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Transactions Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{transactions.length} Records</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                <th className="p-4 pl-6">Description</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Date</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500 italic">
                                            No transactions found. Add one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((t) => (
                                    <tr key={t.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 pl-6 font-medium text-slate-700 dark:text-slate-200">{t.description}</td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                                        <td className={cn("p-4 font-bold text-right", t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200')}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleDelete(t.id)}
                                                className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
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
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 sticky top-6 transition-colors">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <Plus size={18} />
                            </div>
                            New Transaction
                        </h3>
                        
                        <form onSubmit={handleAddTransaction} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={cn(
                                        "w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500",
                                        errors.description ? "border-rose-300 dark:border-rose-700 focus:border-rose-500" : "border-slate-200 dark:border-slate-700"
                                    )}
                                    placeholder="e.g., Grocery Shopping"
                                />
                                {errors.description && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.description}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">$</span>
                                        <input
                                            type="number"
                                            name="amount"
                                            step="0.01"
                                            value={formData.amount || ''}
                                            onChange={handleInputChange}
                                            className={cn(
                                                "w-full pl-7 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500",
                                                errors.amount ? "border-rose-300 dark:border-rose-700 focus:border-rose-500" : "border-slate-200 dark:border-slate-700"
                                            )}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.amount && <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">{errors.amount}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer text-slate-900 dark:text-white"
                                    >
                                        <option value="expense">Expense</option>
                                        <option value="income">Income</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer text-slate-900 dark:text-white"
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
                                className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-slate-900/10 dark:shadow-indigo-900/20 hover:shadow-slate-900/20 dark:hover:shadow-indigo-900/30 active:scale-[0.98] flex items-center justify-center gap-2"
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
