import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, user => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      const q = query(
        collection(db, 'notificaciones'),
        where('userId', '==', user.uid),
        where('read', '==', false)
      );
      const unsub = onSnapshot(q, snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setNotifications(items);
        setUnreadCount(items.length);
      });
      return unsub;
    });
    return () => unsubAuth();
  }, []);

  const markAsRead = async id => {
    try {
      await updateDoc(doc(db, 'notificaciones', id), { read: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const promises = notifications.map(n => updateDoc(doc(db, 'notificaciones', n.id), { read: true }));
    try {
      await Promise.all(promises);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotificationsStore = () => useContext(NotificationsContext);
