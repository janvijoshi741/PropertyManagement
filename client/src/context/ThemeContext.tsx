import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '@/api/apiClient';

interface TenantBranding {
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color?: string;
  font_family?: string;
}

interface ThemeContextType {
  branding: TenantBranding | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  branding: null,
  loading: false,
  refreshBranding: async () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBranding = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await apiClient.get('/tenant-branding');
      const data = response.data.data;
      setBranding(data);

      if (data.primary_color) {
        document.documentElement.style.setProperty('--primary', data.primary_color);
      }
      if (data.secondary_color) {
        document.documentElement.style.setProperty('--secondary', data.secondary_color);
      }
      if (data.font_family) {
        document.documentElement.style.setProperty('--font-sans', `${data.font_family}, sans-serif`);
      }
    } catch (error) {
      console.error('Failed to fetch tenant branding:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBranding();
    } else {
      setBranding(null);
      // Reset to defaults
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--secondary');
      document.documentElement.style.removeProperty('--font-sans');
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{ branding, loading, refreshBranding: fetchBranding }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
