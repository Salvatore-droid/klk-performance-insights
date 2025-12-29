import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';

type AppRole = 'admin' | 'beneficiary';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: AppRole;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string, isAdmin?: boolean) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<{ error: string | null }>;
  apiRequest: <T = any>(endpoint: string, options?: RequestInit) => Promise<{ data?: T; error?: string; response?: Response }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SIMPLIFIED: Direct URL without environment variables
const API_BASE_URL = 'http://localhost:8000/api';

// Token storage key
const TOKEN_KEY = 'kids_league_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize auth from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      
      if (storedToken) {
        try {
          const userData = await validateToken(storedToken);
          if (userData) {
            setToken(storedToken);
            setUser(userData);
            setRole(userData.role);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem(TOKEN_KEY);
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const validateToken = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  };

  const signIn = async (email: string, password: string, isAdmin: boolean = false): Promise<{ error: string | null }> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Login failed' };
      }

      // Check if user has admin privileges if logging in as admin
      if (isAdmin && !data.user.is_admin && data.user.role !== 'admin') {
        return { error: 'Admin privileges required. Please use admin credentials.' };
      }

      // Store token and user data
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setRole(data.user.role);

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<{ error: string | null }> => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          confirmPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Signup failed' };
      }

      // Store token and user data
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      setRole(data.user.role);

      toast({
        title: 'Account created!',
        description: data.message || 'Welcome to Kids League Kenya',
      });

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setRole(null);
      navigate('/auth');
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ error: string | null }> => {
    try {
      if (!token) {
        return { error: 'Not authenticated' };
      }

      const response = await fetch(`${API_BASE_URL}/auth/change-password/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Password change failed' };
      }

      // Update token if a new one was returned
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
      }

      toast({
        title: 'Success!',
        description: data.message || 'Password updated successfully',
      });

      return { error: null };
    } catch (error) {
      console.error('Password change error:', error);
      return { error: 'Network error. Please try again.' };
    }
  };

  // API request helper with auth token - FIXED to handle FormData
  const apiRequest = useCallback(async <T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ data?: T; error?: string; response?: Response }> => {
    // Check if we're sending FormData
    const isFormData = options.body instanceof FormData;
    
    // Create headers object
    const headers = new Headers();
    
    // Only set Content-Type to JSON if it's not FormData
    if (!isFormData) {
      headers.append('Content-Type', 'application/json');
    }
    
    // Add authorization if token exists
    if (token) {
      headers.append('Authorization', `Bearer ${token}`);
    }
    
    // Add any custom headers from options
    if (options.headers) {
      const customHeaders = new Headers(options.headers);
      customHeaders.forEach((value, key) => {
        headers.append(key, value);
      });
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // If token is expired, logout
      if (response.status === 401) {
        await signOut();
        return { error: 'Session expired. Please login again.', response };
      }

      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Response is not JSON
        if (!response.ok) {
          return { error: `Request failed with status ${response.status}`, response };
        }
        return { response };
      }

      if (!response.ok) {
        return { error: data.error || `Request failed with status ${response.status}`, response };
      }

      return { data: data as T, response };
    } catch (error) {
      console.error('API request error:', error);
      return { error: 'Network error. Please check your connection.' };
    }
  }, [token, signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        signIn,
        signUp,
        signOut,
        changePassword,
        apiRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};