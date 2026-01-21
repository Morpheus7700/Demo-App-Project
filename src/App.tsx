import { StrictMode } from 'react';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { ChatAssistant } from './components/ChatAssistant';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TransactionService } from './services/transactionService';

function AppContent() {
  const { user } = useAuth();
  
  if (!user) {
      return <LoginPage />;
  }

  // Get current data to pass to AI context
  // Note: In a real app with Redux/Context, this would be cleaner.
  // Here we just fetch it fresh for the AI component to use.
  const transactions = TransactionService.getAll(user.id);
  
  return (
    <>
      <Dashboard />
      <ChatAssistant transactions={transactions} userName={user.name} />
    </>
  );
}

function App() {
  return (
    <StrictMode>
      <AuthProvider>
        <ThemeProvider defaultTheme="system" storageKey="wealthwise-theme">
          <AppContent />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </AuthProvider>
    </StrictMode>
  );
}

export default App;
