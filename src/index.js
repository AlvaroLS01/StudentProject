// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/global.css';
import './styles/forms.css';
import App from './App';
import { NotificationProvider } from './NotificationContext';
import { NotificationsProvider } from './NotificationsStore';
import { AuthProvider } from './AuthContext';
import { ChildProvider } from './ChildContext';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from 'styled-components';
import { theme, GlobalStyle } from './theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <AuthProvider>
        <ChildProvider>
          <NotificationsProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </NotificationsProvider>
        </ChildProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// Si quieres medir rendimiento, pasa aquí una función, por ejemplo: reportWebVitals(console.log)
reportWebVitals();
