import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  email: string;
  name?: string;
  businessName?: string;
  role: 'admin' | 'seller' | 'customer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('desiconnect_token');
    const savedUser = localStorage.getItem('desiconnect_user');
    
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user data:', error);
        localStorage.removeItem('desiconnect_token');
        localStorage.removeItem('desiconnect_user');
      }
    }
  }, []);
  
  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('desiconnect_token', newToken);
    localStorage.setItem('desiconnect_user', JSON.stringify(newUser));
    
    toast({
      title: "Login successful",
      description: `Welcome ${newUser.name || newUser.businessName || newUser.email}!`,
    });
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('desiconnect_token');
    localStorage.removeItem('desiconnect_user');
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };
  
  const isAuthenticated = !!user && !!token;
  const isAdmin = isAuthenticated && user.role === 'admin';
  const isSeller = isAuthenticated && user.role === 'seller';
  const isCustomer = isAuthenticated && user.role === 'customer';
  
  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        isAuthenticated,
        isAdmin,
        isSeller,
        isCustomer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
