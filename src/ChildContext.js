import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const ChildContext = createContext();

export const ChildProvider = ({ children }) => {
  const { userData } = useAuth();
  const [childList, setChildList] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);

  useEffect(() => {
    if (userData?.rol === 'padre') {
      const hijos = (userData.hijos || []).filter(h => !h.disabled);
      setChildList(hijos);
      setSelectedChild(prev => {
        if (prev && hijos.some(h => h.id === prev.id)) {
          return prev;
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
