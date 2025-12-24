import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- Environment Variable Polyfill ---
// 确保在浏览器环境中 process.env.API_KEY 可用
try {
  // 如果 process 不存在，创建一个空对象
  if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }

  // 尝试从 Vite 的 import.meta.env 获取 key 并注入到 process.env
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    const viteKey = import.meta.env.VITE_API_KEY || import.meta.env.API_KEY;
    if (viteKey) {
      // @ts-ignore
      (window as any).process.env.API_KEY = viteKey;
    }
  }
} catch (e) {
  console.warn("Environment polyfill failed:", e);
}
// -------------------------------------

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