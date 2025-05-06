import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createApiClient } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  checkTokenValidity: () => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  const login = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  const checkTokenValidity = useCallback(async () => {
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }

    try {
      const apiClient = createApiClient(token);
      const result = await apiClient.validateToken();
      
      if (!result.valid) {
        // Token is invalid or expired
        logout();
        return false;
      }
      
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }, [token, logout]);

  // Check token validity on initial load
  useEffect(() => {
    const validateToken = async () => {
      setIsLoading(true);
      await checkTokenValidity();
      setIsLoading(false);
    };

    validateToken();
  }, [checkTokenValidity]);

  const value = {
    isAuthenticated,
    token,
    login,
    logout,
    checkTokenValidity,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 