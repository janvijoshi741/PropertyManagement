import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadFromStorage(): { user: User | null; accessToken: string | null } {
  try {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    return { user, accessToken: token };
  } catch {
    return { user: null, accessToken: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadFromStorage);

  const login = useCallback((token: string, user: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ user, accessToken: token });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setState({ user: null, accessToken: null });
  }, []);

  const value: AuthContextType = {
    user: state.user,
    accessToken: state.accessToken,
    login,
    logout,
    isAuthenticated: !!state.accessToken,
    isAdmin: state.user?.role === 'master_admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
