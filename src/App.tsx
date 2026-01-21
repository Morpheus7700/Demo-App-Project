import { StrictMode } from 'react';
import Dashboard from './components/Dashboard';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { ChatAssistant } from './components/ChatAssistant';

function App() {
  return (
    <StrictMode>
      <ThemeProvider defaultTheme="system" storageKey="wealthwise-theme">
        <Dashboard />
        <ChatAssistant />
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </StrictMode>
  );
}

export default App;