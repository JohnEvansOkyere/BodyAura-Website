// frontend/src/hooks/useAuth.ts

import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

interface ApiError {
  detail: string;
}

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
    onError: (error: AxiosError<ApiError>) => {
      // Show specific error message from backend
      const message = error.response?.data?.detail || 'Invalid email or password';
      
      // Customize message based on error
      if (message.toLowerCase().includes('email')) {
        toast.error('Email not found. Please check your email or sign up.');
      } else if (message.toLowerCase().includes('password')) {
        toast.error('Incorrect password. Please try again.');
      } else {
        toast.error(message);
      }
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
    onError: (error: AxiosError<ApiError>) => {
      // Show specific error message from backend
      const message = error.response?.data?.detail || 'Signup failed';
      
      // Customize message based on error
      if (message.toLowerCase().includes('email already')) {
        toast.error('This email is already registered. Please login instead.');
      } else if (message.toLowerCase().includes('password')) {
        toast.error('Password does not meet requirements.');
      } else if (message.toLowerCase().includes('validation')) {
        toast.error('Please check your information and try again.');
      } else {
        toast.error(message);
      }
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