import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Globe, Loader2, Sparkles, User, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Transaction } from '../types';
import { AIService } from '../services/aiService';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type ChatAssistantProps = {
  transactions: Transaction[];
  userName: string;
};

export function ChatAssistant({ transactions, userName }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `### Welcome back, ${userName}!\n\nI'm your **WealthWise AI Consultant**. I have been upgraded with **Unified Intelligence**, allowing me to analyze your actual spending data and perform live web searches for market trends.\n\nHow can I assist your financial journey today?`,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isSearching]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
    
    setIsTyping(true);
    
    // Check if query likely requires a web search for the status indicator
    if (query.toLowerCase().match(/rate|stock|market|price|inflation/)) {
        setIsSearching(true);
    }

    try {
        const responseText = await AIService.generateResponse(query, transactions);
        
        // Add a slight delay for realistic "AI thinking"
        await new Promise(r => setTimeout(r, 1000));

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
        console.error("AI Error:", error);
    } finally {
        setIsTyping(false);
        setIsSearching(false);
    }
  };

  // Simple Markdown-ish Renderer for professional output
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-2 mb-1">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={i} className="ml-4 list-disc mb-1">{line.replace('- ', '')}</li>;
      }
      
      // Handle bolding **text**
      const parts = line.split(/(\*\*.*?\*\*)/);
      return (
        <p key={i} className="mb-2">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
            }
            
            // Handle links [text](url)
            if (part.match(/\[(.*?)\]\((.*?)\)/)) {
                const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                if (linkMatch) {
                    return <a key={j} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline inline-flex items-center gap-0.5">{linkMatch[1]} <ExternalLink size={10}/></a>;
                }
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 transition-all duration-300 z-40 flex items-center gap-2",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Sparkles size={24} />
        <span className="font-semibold hidden sm:inline">Ask Finance AI</span>
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 w-[95vw] sm:w-[450px] h-[650px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 z-50 origin-bottom-right",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 p-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-none">WealthWise Agent</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 mt-1 uppercase tracking-wider font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Live Data & Web Connected
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-4 max-w-[90%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                msg.role === 'user' ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-indigo-600 text-white"
              )}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm transition-all",
                msg.role === 'user' 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none"
              )}>
                {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                <div className={cn(
                  "text-[10px] mt-2 opacity-50 font-medium",
                  msg.role === 'user' ? "text-indigo-100" : "text-slate-400"
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Combined Loader */}
          {(isTyping || isSearching) && (
             <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 text-white animate-pulse">
                    {isSearching ? <Globe size={18} /> : <Bot size={18} />}
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-4">
                    <Loader2 size={18} className="animate-spin text-indigo-500" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 italic">
                        {isSearching ? "Browsing financial web sources..." : "Analyzing transaction records..."}
                    </span>
                </div>
             </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSendMessage} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about spending or market trends..."
              className="w-full pl-5 pr-14 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-all shadow-md shadow-indigo-600/20"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="flex items-center justify-center gap-4 mt-3 opacity-50">
             <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <Globe size={10} /> Web Enabled
             </div>
             <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <Activity size={10} /> Data Aware
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
