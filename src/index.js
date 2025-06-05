// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';          // <-- tus estilos globales con Poppins
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Si quieres medir rendimiento, pasa aquí una función, por ejemplo: reportWebVitals(console.log)
reportWebVitals();
