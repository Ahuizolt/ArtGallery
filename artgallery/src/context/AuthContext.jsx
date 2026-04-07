import { createContext, useState, useEffect, useCallback } from 'react';
import { refresh as apiRefresh } from '../services/authApi';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('refresh_token');
    setAccessToken(null);
    setIsAuthenticated(false);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (!storedRefreshToken) { logout(); return; }
    try {
      const data = await apiRefresh(storedRefreshToken);
      setAccessToken(data.access_token);
      setIsAuthenticated(true);
    } catch {
      logout();
    }
  }, [logout]);

  const loginAction = useCallback((newAccessToken, newRefreshToken) => {
    localStorage.setItem('refresh_token', newRefreshToken);
    setAccessToken(newAccessToken);
    setIsAuthenticated(true);
  }, []);

  useEffect(() => {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    if (storedRefreshToken) {
      refreshAccessToken().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider value={{ accessToken, isAuthenticated, loading, login: loginAction, logout, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}
