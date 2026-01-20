import { StrictMode } from 'react';
import Dashboard from './components/Dashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <StrictMode>
      <Dashboard />
      <Toaster position="top-right" richColors />
    </StrictMode>
  );
}

export default App;