import { createContext, useContext, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

function loadUser() {
  try { return JSON.parse(localStorage.getItem('sweety_user')); } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const saveSession = ({ user, token }) => {
    localStorage.setItem('sweety_token', token);
    localStorage.setItem('sweety_user', JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => saveSession(await api.login({ email, password }));
  const register = async (name, email, password) =>
    saveSession(await api.register({ name, email, password }));

  const logout = () => {
    localStorage.removeItem('sweety_token');
    localStorage.removeItem('sweety_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
