import type { Transaction } from '../types';

export const InsightService = {
  generateInsights: (transactions: Transaction[]): string[] => {
    const insights: string[] = [];
    
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');
    
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    // Savings Rate Logic
    if (totalExpense > totalIncome) {
      insights.push("⚠️ Warning: Expenses exceed income. Review your non-essential spending.");
    } else if (totalIncome > 0 && totalExpense > totalIncome * 0.8) {
      insights.push("💡 You're saving less than 20% of your income. Aim to reduce discretionary spending.");
    } else if (totalIncome > 0) {
      insights.push("✅ Great job! You are maintaining a healthy savings rate above 20%.");
    }

    // Category Specific Logic
    const foodExpenses = expenses
      .filter(t => t.category === 'Food')
      .reduce((sum, t) => sum + t.amount, 0);
      
    if (foodExpenses > 500) {
      insights.push("🍔 Food spending is high (>$500). Cooking at home could save significant money.");
    }

    const subExpenses = expenses
        .filter(t => t.description.toLowerCase().includes('subscription') || t.category === 'Entertainment')
        .reduce((sum, t) => sum + t.amount, 0);
    
    if (subExpenses > 200) {
        insights.push("📺 Entertainment & Subscriptions are adding up. Check for unused services.");
    }

    return insights;
  }
};
