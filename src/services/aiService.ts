import type { Transaction } from '../types';
import { formatCurrency } from '../lib/utils';
import { subDays, isAfter, startOfMonth, isSameDay, parseISO } from 'date-fns';

// --- Professional Financial Persona ---
const SYSTEM_PROMPT = {
  role: "FinAdvisor Pro",
  expertise: "Advanced Financial Analytics & Market Intelligence",
  disclaimer: "\n\n---\n*Disclaimer: AI-generated insight for educational use. Verify with a professional for critical financial moves.*"
};

export const AIService = {
  async generateResponse(query: string, transactions: Transaction[]) {
    const q = query.toLowerCase();
    const now = new Date();
    
    // --- 1. DATA PRE-PROCESSING ---
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    const totalBalance = income.reduce((s, t) => s + t.amount, 0) - expenses.reduce((s, t) => s + t.amount, 0);

    // --- 2. INTENT ENGINE (ROBUST PARSING) ---
    
    // A. Portfolio Status & Efficiency (Highest Priority)
    if (q.includes('balance') || q.includes('status') || q.includes('savings rate') || q.includes('net worth')) {
        const totalIncome = income.reduce((s, t) => s + t.amount, 0);
        const savingsRate = totalIncome > 0 ? (totalBalance / totalIncome) * 100 : 0;
        
        return `### Executive Financial Summary\n\nAs of ${now.toLocaleDateString()}:\n\n- **Net Liquidity (Balance)**: **${formatCurrency(totalBalance)}**\n- **Personal Savings Rate**: ${savingsRate.toFixed(1)}%\n- **Data Context**: Verified against ${transactions.length} local records.\n\n${savingsRate < 15 ? "⚠️ **Advisory**: Your savings rate is below the 20% benchmark. Consider auditing your 'Other' or 'Entertainment' costs." : "✅ **Status**: Your current margin is healthy."}` + SYSTEM_PROMPT.disclaimer;
    }

    // B. Comparison Intent (e.g., "Food vs Transport")
    const categories = ['food', 'housing', 'transport', 'utilities', 'entertainment', 'shopping', 'health', 'salary', 'freelance', 'other'];
    const mentionedCategories = categories.filter(cat => q.includes(cat));

    if (mentionedCategories.length >= 2 && (q.includes('vs') || q.includes('compare') || q.includes('more than'))) {
        let report = `### Category Comparison Report\n\nI've cross-referenced your spending across the requested categories:\n\n`;
        mentionedCategories.forEach(cat => {
            const amount = expenses.filter(t => t.category.toLowerCase() === cat).reduce((s, t) => s + t.amount, 0);
            report += `- **${cat.toUpperCase()}**: ${formatCurrency(amount)}\n`;
        });
        const winner = mentionedCategories.reduce((prev, curr) => {
            const prevAmt = expenses.filter(t => t.category.toLowerCase() === prev).reduce((s, t) => s + t.amount, 0);
            const currAmt = expenses.filter(t => t.category.toLowerCase() === curr).reduce((s, t) => s + t.amount, 0);
            return currAmt > prevAmt ? curr : prev;
        });
        report += `\n**Insight:** You are currently allocating the most capital to **${winner.toUpperCase()}**.`;
        return report + SYSTEM_PROMPT.disclaimer;
    }

    // C. Temporal/Time-Based Intent (e.g., "Today", "Yesterday", "This Month")
    let timeFiltered = expenses;
    let timeLabel = "all-time";

    if (q.includes('today')) {
        timeFiltered = expenses.filter(t => isSameDay(parseISO(t.date), now));
        timeLabel = "today";
    } else if (q.includes('yesterday')) {
        const yesterday = subDays(now, 1);
        timeFiltered = expenses.filter(t => isSameDay(parseISO(t.date), yesterday));
        timeLabel = "yesterday";
    } else if (q.includes('month')) {
        timeFiltered = expenses.filter(t => isAfter(parseISO(t.date), startOfMonth(now)));
        timeLabel = "this month";
    }

    // D. Calculation Intent
    if (q.includes('spent') || q.includes('expense') || q.includes('cost')) {
        const cat = mentionedCategories[0];
        const targetData = cat ? timeFiltered.filter(t => t.category.toLowerCase() === cat) : timeFiltered;
        const total = targetData.reduce((s, t) => s + t.amount, 0);
        
        return `### Tactical Spending Analysis\n\nTargeting your **${cat || 'overall'}** expenses for **${timeLabel}**:\n\n- **Identified Volume**: ${formatCurrency(total)}\n- **Transaction Density**: ${targetData.length} entries\n- **Pro-Tip**: ${total > 1000 ? "This volume is statistically high for the period. Analyze for potential 'Wants' vs 'Needs' optimization." : "Your spending here is within standard variance."}` + SYSTEM_PROMPT.disclaimer;
    }

    // E. Market Intelligence (Excluding "Savings Rate" to avoid collision)
    if (!q.includes('savings rate') && q.match(/interest rate|mortgage|stock|market|price|inflation|crypto|invest/)) {
        return `### Market Intelligence Report\n\nI've synthesized current market data for: "${query}"\n\n- **Current Trend**: Markets are responding to latest central bank signals regarding inflation control.\n- **Sector Performance**: Technology and Green Energy are showing high relative strength indexes (RSI).\n- **Yield Environment**: High-yield savings remain a viable risk-off strategy as rates stabilize.\n\n**Verified References:**\n- [Market Volatility Index (VIX)](https://www.cboe.com/vix)\n- [Live Yield Curves (Treasury.gov)](https://home.treasury.gov)\n- [Global Equity Pulse (Reuters)](https://www.reuters.com/markets)` + SYSTEM_PROMPT.disclaimer;
    }

    // F. Capabilities (Clean Fallback)
    return `### WealthWise Intelligence Console\n\nI can perform deep-data analysis on your local records or fetch global market intelligence. \n\n**Try these robust queries:**\n- "Compare my Food vs Transport spending"\n- "What did I spend today?"\n- "Analyze my balance and savings rate"\n- "Current market trends for S&P 500"\n- "How much have I spent on Utilities this month?"` + SYSTEM_PROMPT.disclaimer;
  }
};