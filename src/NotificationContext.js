import React, { useState, useContext, createContext } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const show = msg => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 4000);
  };

  return (
    <NotificationContext.Provider value={{ show }}>
      {visible && <div className="notification">{message}</div>}
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
