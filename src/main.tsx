import React from 'react'; // Explicitly import React
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSentry } from './config/sentry';
import { initGA4 } from './config/analytics';
import { ThemeProvider } from './components/ThemeProvider';

// Initialize Sentry for error tracking
initSentry();

// Initialize Google Analytics 4 (if user has given consent)
// GA4 will check for cookie consent before actually initializing
initGA4();

// Add preload class to prevent transitions on page load
document.documentElement.classList.add('preload');

// Remove preload class after initial render to enable smooth theme transitions
setTimeout(() => {
  document.documentElement.classList.remove('preload');
}, 100);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <App />
  </ThemeProvider>
);
