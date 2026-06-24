import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { loginUser, registerUser, updateUserProfile, UserData, UserProfileInput } from '../services/authService';
import { Platform } from 'react-native';

interface AuthContextType {
  user: UserData | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  walletBalance: number;
  loyaltyPoints: number;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (profile: UserProfileInput) => Promise<void>;
  logout: () => void;
  topUpWallet: (amount: number) => void;
  spendWallet: (amount: number) => boolean;
  addLoyaltyPoints: (points: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WALLET: 'coffee_shop_wallet_balance',
  POINTS: 'coffee_shop_loyalty_points',
};

const getPersistedData = (email: string, key: string, defaultValue: number): number => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const val = window.localStorage.getItem(`${email}_${key}`);
    return val ? parseFloat(val) : defaultValue;
  }
  return defaultValue;
};

const setPersistedData = (email: string, key: string, value: number) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.localStorage.setItem(`${email}_${key}`, value.toString());
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(50.00);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(120);

  const isAdmin = user?.role === 'admin';
  const isLoggedIn = user !== null;
  const storageOwner = user?.email || 'guest';

  // Load wallet and points when user changes
  useEffect(() => {
    setWalletBalance(getPersistedData(storageOwner, STORAGE_KEYS.WALLET, 50.00));
    setLoyaltyPoints(getPersistedData(storageOwner, STORAGE_KEYS.POINTS, 120));
  }, [storageOwner]);

  const login = useCallback(async (email: string, password: string) => {
    const userData = await loginUser(email, password);
    setUser(userData);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await registerUser(name, email, password);
  }, []);

  const updateProfile = useCallback(async (profile: UserProfileInput) => {
    if (!user?.id) throw new Error('MISSING_USER_ID');

    await updateUserProfile(user.id, profile);
    setUser(current => current ? { ...current, ...profile } : current);
  }, [user?.id]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const topUpWallet = useCallback((amount: number) => {
    setWalletBalance(prev => {
      const newVal = prev + amount;
      setPersistedData(storageOwner, STORAGE_KEYS.WALLET, newVal);
      return newVal;
    });
  }, [storageOwner]);

  const spendWallet = useCallback((amount: number): boolean => {
    if (walletBalance >= amount) {
      setWalletBalance(prev => {
        const newVal = prev - amount;
        setPersistedData(storageOwner, STORAGE_KEYS.WALLET, newVal);
        return newVal;
      });
      return true;
    }
    return false;
  }, [walletBalance, storageOwner]);

  const addLoyaltyPoints = useCallback((points: number) => {
    setLoyaltyPoints(prev => {
      const newVal = prev + points;
      setPersistedData(storageOwner, STORAGE_KEYS.POINTS, newVal);
      return newVal;
    });
  }, [storageOwner]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoggedIn,
        walletBalance,
        loyaltyPoints,
        login,
        register,
        updateProfile,
        logout,
        topUpWallet,
        spendWallet,
        addLoyaltyPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
