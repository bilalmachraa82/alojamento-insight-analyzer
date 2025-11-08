import React from 'react'; // Explicitly import React
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSentry } from './config/sentry';
import { initGA4 } from './config/analytics';

// Initialize Sentry for error tracking
initSentry();

// Initialize Google Analytics 4 (if user has given consent)
// GA4 will check for cookie consent before actually initializing
initGA4();

createRoot(document.getElementById("root")!).render(<App />);
