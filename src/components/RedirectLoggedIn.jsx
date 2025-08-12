import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RedirectLoggedIn() {
  const { user, userData, loading } = useAuth();

  if (loading) return null;

  if (user && userData) {
    const target =
      userData.rol === 'admin'
        ? '/admin'
        : userData.rol === 'profesor'
        ? '/profesor'
        : '/tutor';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
