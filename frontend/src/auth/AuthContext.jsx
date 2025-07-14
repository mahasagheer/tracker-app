import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, logoutApi } from './authApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [userType, setUserType] = useState(() => {
    const stored = localStorage.getItem('userType');
    return stored || null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginApi({ email, password });
      setUser(data.user);
      setUserType(data.userType);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('userType', data.userType);
      setLoading(false);
      return { user: data.user, userType: data.userType }; // Return user and userType
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await logoutApi();
      setUser(null);
      setUserType(null);
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userType, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
} 