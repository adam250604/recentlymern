import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem('auth');
    return raw ? JSON.parse(raw) : { token: null, user: null };
  });

  useEffect(() => {
    localStorage.setItem('auth', JSON.stringify(auth));
  }, [auth]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const token = data.token || data.access || data.accessToken;
      let user = data.user || null;
      if (!user && token) {
        try {
          user = jwtDecode(token);
        } catch {}
      }
      setAuth({ token, user });
      toast.success('Logged in');
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Login failed');
      return false;
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post('/auth/register', payload);
      toast.success('Registration successful');
      if (data?.token) {
        let user = data.user || null;
        try {
          user = user || jwtDecode(data.token);
        } catch {}
        setAuth({ token: data.token, user });
      }
      return true;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    setAuth({ token: null, user: null });
    localStorage.removeItem('auth');
    toast.info('Logged out');
  };

  const value = useMemo(
    () => ({
      token: auth.token,
      user: auth.user,
      isAuthenticated: !!auth.token,
      login,
      register,
      logout,
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

