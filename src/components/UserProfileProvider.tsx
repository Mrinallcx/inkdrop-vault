import React, { createContext, useContext } from 'react';
import { useUserProfile, UserProfile } from '@/hooks/useUserProfile';

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<UserProfile | null>;
  fetchProfile: () => Promise<UserProfile | null>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfileContext = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfileContext must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: React.ReactNode;
}

export const UserProfileProvider = ({ children }: UserProfileProviderProps) => {
  const { profile, loading, error, updateProfile, fetchProfile } = useUserProfile();

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        updateProfile,
        fetchProfile,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
};