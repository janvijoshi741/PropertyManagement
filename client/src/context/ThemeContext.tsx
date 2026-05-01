import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  refreshBranding: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  branding: null,
  loading: false,
  refreshBranding: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();

  const { data: branding, isLoading, refetch } = useQuery({
    queryKey: ['tenantBranding', user?.id],
    queryFn: async () => {
      const response = await apiClient.get('/tenant-branding');
      return response.data.data as TenantBranding;
    },
    enabled: !!user && !isAdmin,
  });

  useEffect(() => {
    // Only apply branding if user is NOT a master admin
    if (branding && !isAdmin) {
      if (branding.primary_color) {
        document.documentElement.style.setProperty('--primary', branding.primary_color);
      }
      if (branding.secondary_color) {
        document.documentElement.style.setProperty('--secondary', branding.secondary_color);
      }
      if (branding.font_family) {
        document.documentElement.style.setProperty('--font-sans', `${branding.font_family}, sans-serif`);
      }
    } else {
      // Reset to defaults if logged out or if user is a master admin
      document.documentElement.style.removeProperty('--primary');
      document.documentElement.style.removeProperty('--secondary');
      document.documentElement.style.removeProperty('--font-sans');
    }
  }, [branding, user, isAdmin]);

  // For admins, we explicitly return null branding to prevent any stale data leaks
  const effectiveBranding = !isAdmin && branding ? branding : null;

  return (
    <ThemeContext.Provider value={{ branding: effectiveBranding, loading: isLoading, refreshBranding: refetch }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
