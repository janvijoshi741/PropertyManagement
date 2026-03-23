import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';

export const useRequestOtp = () =>
  useMutation({
    mutationFn: (email: string) => authApi.requestOtp(email),
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Failed to send access code');
      }
    },
  });

export const useVerifyOtp = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, code }: { email: string; code: string }) =>
      authApi.verifyOtp(email, code),
    onSuccess: (data) => {
      login(data.accessToken, data.user);
      toast.success('Welcome back!');
      navigate('/dashboard');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Invalid access code');
      }
    },
  });
};

export const useAdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.adminLogin(email, password),
    onSuccess: (data) => {
      login(data.accessToken, data.user);
      toast.success('Welcome back, admin!');
      navigate('/admin/dashboard');
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || 'Invalid credentials');
      }
    },
  });
};
