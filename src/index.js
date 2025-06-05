// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { NotificationProvider } from "./NotificationContext";
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from 'styled-components';
import { theme, GlobalStyle } from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
            <NotificationProvider>
        <App />
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// Si quieres medir rendimiento, pasa aquí una función, por ejemplo: reportWebVitals(console.log)
reportWebVitals();
