import React, { useState, useContext, createContext } from 'react';
import styled, { keyframes } from 'styled-components';

const NotificationContext = createContext();

const slideUp = keyframes`
  from { opacity: 0; transform: translate(-50%, 20px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
`;

const Toast = styled.div`
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: #fff;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  animation: ${slideUp} 0.4s ease;
  font-size: 1rem;
  background: ${({ type }) =>
    type === 'error' ? '#ff6b6b' : '#02c37e'};
`;

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [visible, setVisible] = useState(false);

  const show = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setVisible(true);
    setTimeout(() => setVisible(false), 4000);
  };

  return (
    <NotificationContext.Provider value={{ show }}>
      {visible && (
        <Toast className="notification" type={toast.type}>
          {toast.message}
        </Toast>
      )}
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
