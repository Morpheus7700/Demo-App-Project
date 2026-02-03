import { Transaction } from './types';
import { AIService } from './src/services/aiService';

// --- STRESS TEST CONFIGURATION ---
const MOCK_TRANSACTIONS: Transaction[] = Array.from({ length: 5000 }, (_, i) => ({
  id: `id-${i}`,
  description: i % 2 === 0 ? 'Monthly Salary' : 'High Frequency Trading',
  amount: i % 2 === 0 ? 5000 : 100,
  type: i % 2 === 0 ? 'income' : 'expense',
  category: i % 2 === 0 ? 'Salary' : 'Other',
  date: new Date().toISOString()
}));

async function runStressTest() {
  console.log("🚀 Starting Stress Test: 5,000 Transactions");
  
  const start = Date.now();
  
  // Test Case 1: Complex Calculation Intent
  console.log("\n--- TEST 1: Calculation Logic ---");
  const response1 = await AIService.generateResponse("What is my total balance and how much have I made?", MOCK_TRANSACTIONS);
  console.log("AI Response Snippet:", response1.substring(0, 200) + "...");
  
  // Test Case 2: Category Filtering Intent
  console.log("\n--- TEST 2: Category Deep-Dive ---");
  const response2 = await AIService.generateResponse("How much have I spent on Other things?", MOCK_TRANSACTIONS);
  console.log("AI Response Snippet:", response2.substring(0, 200) + "...");

  // Test Case 3: Empty Data Edge Case
  console.log("\n--- TEST 3: Empty Transaction List ---");
  const response3 = await AIService.generateResponse("What is my balance?", []);
  console.log("AI Response Snippet:", response3.substring(0, 200) + "...");

  const end = Date.now();
  console.log(`\n✅ Stress Test Completed in ${end - start}ms`);
}

// Node.js 22+ includes native Intl support, so we can just run the test directly.
runStressTest().catch(console.error);
