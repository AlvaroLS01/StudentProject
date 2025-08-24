import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ChildContext = createContext();

export const ChildProvider = ({ children }) => {
  const { userData } = useAuth();
  const [childList, setChildList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    if (userData?.rol === 'tutor') {
      const raw = userData.alumnos || [];
      // Asegura que no haya alumnos repetidos por id
      const alumnos = [];
      const seen = new Set();
      for (const h of raw) {
        if (!h.disabled && !seen.has(h.id)) {
          alumnos.push(h);
          seen.add(h.id);
        }
      }
      setChildList(alumnos);
      setSelectedChild(prev => {
        if (prev && alumnos.some(h => h.id === prev.id)) {
          return prev;
        }
        if (alumnos.length === 1) {
          return alumnos[0];
        }
        return null;
      });
    } else {
      setChildList([]);
      setSelectedChild(null);
    }
  }, [userData]);

  return (
    <ChildContext.Provider
      value={{ childList, selectedChild, setSelectedChild, setChildList }}
    >
      {children}
    </ChildContext.Provider>
  );
};

export const useChild = () => useContext(ChildContext);
