import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { startAutoUpdate } from './domain/autoUpdate';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.PROD) startAutoUpdate(__APP_VERSION__);
