// src/index.js (или src/main.jsx)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TonConnectUIProvider } from '@tonconnect/ui-react'; // Импорт

// URL твоего manifest.json на Vercel
const manifestUrl = 'https://crypto-pet-wars.vercel.app/tonconnect-manifest.json'; // ОБЯЗАТЕЛЬНО УКАЖИ СВОЙ ДОМЕН

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Оборачиваем App в TonConnectUIProvider */}
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>
);
