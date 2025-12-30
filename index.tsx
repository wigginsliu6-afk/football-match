
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Removed manual API key injection logic as process.env.API_KEY is assumed 
// to be pre-configured and accessible in the execution context.
// This also resolves the TypeScript error: Property 'env' does not exist on type 'ImportMeta'.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
