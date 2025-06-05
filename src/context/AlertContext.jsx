import React, { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export function useAlert() {
  return useContext(AlertContext);
}

export function AlertProvider({ children }) {
  const [message, setMessage] = useState('');
  const showAlert = msg => {
    setMessage(msg);
    // Hide after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {message && <div className="app-alert">{message}</div>}
      {children}
    </AlertContext.Provider>
  );
}
