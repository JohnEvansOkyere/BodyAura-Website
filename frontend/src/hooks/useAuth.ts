// frontend/src/hooks/useAuth.ts

import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoginCredentials, SignupData } from '@/types';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, logout: logoutStore } = useAuthStore();
  const navigate = useNavigate();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      toast.success(`Welcome back, ${data.user.full_name}!`);
      navigate('/');
    },
    onError: () => {
      toast.error('Invalid email or password');
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: (data: SignupData) => authService.signup(data),
    onSuccess: (data) => {
      setAuth(data.user, data.access_token);
      toast.success(`Welcome, ${data.user.full_name}!`);
      navigate('/');
    },
    onError: () => {
      toast.error('Signup failed. Please try again.');
    },
  });

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      logoutStore();
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
  };
};