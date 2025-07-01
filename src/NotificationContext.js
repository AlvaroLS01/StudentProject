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
  color: #034640;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  animation: ${slideUp} 0.4s ease;
  font-size: 1rem;
  background: ${({ type }) =>
    type === 'error' ? '#f8d7da' : '#ccf3e5'};
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  transition: opacity 0.4s ease;
`;

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: 'success', visible: false });
  const [display, setDisplay] = useState(false);

  const show = (msg, type = 'success') => {
    setToast({ message: msg, type, visible: true });
    setDisplay(true);
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    setTimeout(() => setDisplay(false), 3400);
  };

  return (
    <NotificationContext.Provider value={{ show }}>
      {display && (
        <Toast
          className="notification"
          type={toast.type}
          visible={toast.visible}
        >
          {toast.message}
        </Toast>
      )}
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
