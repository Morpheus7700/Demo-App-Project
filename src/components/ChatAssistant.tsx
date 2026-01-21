import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Globe, Loader2, Sparkles, User } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import type { Transaction } from '../types';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
};

type ChatAssistantProps = {
  transactions: Transaction[];
  userName: string;
};

// Simulated knowledge base
const KNOWLEDGE_BASE = {
  default: "I can help you with budgeting, saving tips, and understanding your spending habits. Try asking 'How much have I spent on food?' or 'What is my total balance?'",
  savings: "To improve your savings, consider the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Also, automated transfers to a high-yield savings account can be very effective.",
  investing: "Investing is a great way to build wealth over time. Popular options include index funds, ETFs, and individual stocks. Remember to diversify your portfolio to manage risk.",
  budgeting: "A zero-based budget is where your income minus your expenses equals zero. Every dollar has a job. This helps prevent overspending and ensures you're saving enough.",
  debt: "The 'Avalanche Method' (paying off highest interest debt first) saves you the most money, while the 'Snowball Method' (paying off smallest balance first) gives you quick psychological wins.",
  emergency: "Financial experts recommend having 3-6 months of living expenses in an easily accessible emergency fund.",
};

export function ChatAssistant({ transactions, userName }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello ${userName}! I'm your WealthWise AI Assistant. I can browse the web for real-time financial data or answer questions about your personal spending. How can I help you today?`,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, searchQuery]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const analyzeData = (query: string): string | null => {
      const lowerQuery = query.toLowerCase();
      
      const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const balance = income - expense;

      if (lowerQuery.includes('balance') || lowerQuery.includes('how much money')) {
          return `Your current total balance is **${formatCurrency(balance)}**. (Income: ${formatCurrency(income)}, Expenses: ${formatCurrency(expense)})`;
      }

      if (lowerQuery.includes('spent') || lowerQuery.includes('expense') || lowerQuery.includes('spend')) {
          // Check for specific category
          const categories = ['Food', 'Housing', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Other'];
          const matchedCategory = categories.find(c => lowerQuery.includes(c.toLowerCase()));

          if (matchedCategory) {
              const categoryTotal = transactions
                .filter(t => t.type === 'expense' && t.category === matchedCategory)
                .reduce((acc, t) => acc + t.amount, 0);
              return `You have spent a total of **${formatCurrency(categoryTotal)}** on ${matchedCategory}.`;
          }
          
          return `Your total expenses amount to **${formatCurrency(expense)}**. The top spending category is ${
              Object.entries(
                  transactions
                    .filter(t => t.type === 'expense')
                    .reduce((acc: any, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {})
              ).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'unknown'
          }.`;
      }

      if (lowerQuery.includes('income') || lowerQuery.includes('earned') || lowerQuery.includes('make')) {
          return `Your total income recorded is **${formatCurrency(income)}**.`;
      }
      
      if (lowerQuery.includes('transaction') && (lowerQuery.includes('how many') || lowerQuery.includes('count'))) {
          return `You have recorded **${transactions.length}** transactions in total.`;
      }

      return null;
  };

  const generateResponse = async (query: string) => {
    setIsTyping(true);
    
    // 1. Check for data analysis intent first
    const dataAnalysisResult = analyzeData(query);
    if (dataAnalysisResult) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: dataAnalysisResult,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, newMessage]);
        setIsTyping(false);
        return;
    }

    // 2. Simulate web search for complex queries not answered by local data
    if (query.length > 15 && (query.toLowerCase().includes('rate') || query.toLowerCase().includes('stock') || query.toLowerCase().includes('price') || query.toLowerCase().includes('market'))) {
        setSearchQuery(query);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Search delay
        setSearchQuery(null);
    } else {
        await new Promise(resolve => setTimeout(resolve, 1200)); // Standard thinking delay
    }

    const lowerQuery = query.toLowerCase();
    let responseText = KNOWLEDGE_BASE.default;

    if (lowerQuery.includes('sav')) responseText = KNOWLEDGE_BASE.savings;
    else if (lowerQuery.includes('invest') || lowerQuery.includes('stock')) responseText = KNOWLEDGE_BASE.investing;
    else if (lowerQuery.includes('budget')) responseText = KNOWLEDGE_BASE.budgeting;
    else if (lowerQuery.includes('debt') || lowerQuery.includes('loan')) responseText = KNOWLEDGE_BASE.debt;
    else if (lowerQuery.includes('emergency') || lowerQuery.includes('fund')) responseText = KNOWLEDGE_BASE.emergency;
    else if (lowerQuery.includes('rate') || lowerQuery.includes('price') || lowerQuery.includes('cost')) {
        responseText = `Based on my latest web search, current market trends indicate that prices in this sector are fluctuating. For exact figures, I recommend checking a dedicated financial news source like Bloomberg or CNBC, but generally, analysts suggest a cautious approach right now.`;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: responseText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsTyping(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    const query = inputValue;
    setInputValue('');
    
    await generateResponse(query);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 transition-all duration-300 z-40 flex items-center gap-2",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Sparkles size={24} />
        <span className="font-semibold hidden sm:inline">Ask AI</span>
      </button>

      {/* Chat Interface */}
      <div
        className={cn(
          "fixed bottom-6 right-6 w-[90vw] sm:w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Smart Insight AI</h3>
              <div className="flex items-center gap-1.5 text-xs text-indigo-100">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Online & Connected
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
              )}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={cn(
                "p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
              )}>
                {/* Render basic markdown-like bolding */}
                {msg.content.split('**').map((part, i) => 
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
                <div className={cn(
                  "text-[10px] mt-1 opacity-70",
                  msg.role === 'user' ? "text-indigo-200" : "text-slate-400"
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Search Indicator */}
          {searchQuery && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                    <Globe size={16} className="animate-pulse" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">Searching web for <span className="font-semibold">"{searchQuery}"</span>...</span>
                </div>
             </div>
          )}

          {/* Typing Indicator */}
          {isTyping && !searchQuery && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
                    <Bot size={16} />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    </div>
                </div>
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your finances..."
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              disabled={isTyping || !!searchQuery}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping || !!searchQuery}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-all shadow-sm"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-[10px] text-center text-slate-400 mt-2">
            AI can make mistakes. Please verify important financial information.
          </p>
        </div>
      </div>
    </>
  );
}