import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async uid => {
    try {
      const snap = await getDoc(doc(db, 'usuarios', uid));
      setUserData(snap.exists() ? snap.data() : null);
    } catch (err) {
      console.error(err);
      setUserData(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        await fetchUserData(u.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData: () => user && fetchUserData(user.uid) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
