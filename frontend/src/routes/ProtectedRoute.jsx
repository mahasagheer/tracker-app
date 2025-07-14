import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../auth/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuthContext();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
} 