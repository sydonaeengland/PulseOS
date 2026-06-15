import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

function readStorage() {
  try {
    const t = localStorage.getItem('accessToken');
    const u = localStorage.getItem('user');
    return { token: t ?? null, user: u ? JSON.parse(u) : null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStorage().user);
  const [token, setToken] = useState(() => readStorage().token);
  const [loading] = useState(false);

  const login = async (email, password) => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
      { email, password }
    );
    const { accessToken, refreshToken, user: userData } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
