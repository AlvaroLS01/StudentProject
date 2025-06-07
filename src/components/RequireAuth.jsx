import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RequireAuth({ allowedRoles }) {
  const { user, userData, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  if (allowedRoles && userData && !allowedRoles.includes(userData.rol)) {
    return <Navigate to="/home" replace />;
  }

  return <Outlet />;
}
