import React from 'react';
import ReactDOM from 'react-dom/client';
import { AccountGate } from './components/AccountGate';
import './index.css';
import { startAutoUpdate } from './domain/autoUpdate';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AccountGate />
  </React.StrictMode>
);

if (import.meta.env.PROD) startAutoUpdate(__APP_VERSION__);
