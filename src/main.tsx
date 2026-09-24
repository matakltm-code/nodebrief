import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign browser ResizeObserver loop completed notifications
if (typeof window !== 'undefined') {
  const resizeObserverErrorHandler = (e: ErrorEvent) => {
    if (
      e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
      e.message === 'ResizeObserver loop limit exceeded' ||
      (typeof e.message === 'string' && e.message.includes('ResizeObserver loop'))
    ) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  };
  window.addEventListener('error', resizeObserverErrorHandler);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
