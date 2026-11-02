import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, UserRole, ActiveTab } from '../types';

interface AuthContextType {
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (username: string, pass: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  createMemberAccount: (
    name: string,
    username: string,
    pass: string,
    role: UserRole
  ) => Promise<{ success: boolean; error?: string }>;
  updateCurrentUserProfile: (
    name: string,
    photoUrl?: string,
    newPassword?: string,
    preferences?: {
      defaultPaymentMethod?: string;
      defaultModule?: ActiveTab;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'family_expense_user_profile_v2';
const LOCAL_STORAGE_REMEMBER_USER_KEY = 'family_expense_remember_username_v2';

export const DEFAULT_ADMIN_USERNAME = 'admin';
export const DEFAULT_ADMIN_PASS = 'admin123';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize Admin Account in Firestore if missing
  const ensureAdminExists = async () => {
    try {
      const adminRef = doc(db, 'users', 'user_admin');
      const snap = await getDoc(adminRef);
      if (!snap.exists()) {
        const adminUser: UserProfile = {
          id: 'user_admin',
          username: DEFAULT_ADMIN_USERNAME,
          displayName: 'Family Admin',
          role: 'admin',
          password: DEFAULT_ADMIN_PASS,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(adminRef, adminUser);
      }
    } catch (e) {
      console.warn('Initial admin check warning (offline mode or rules):', e);
    }
  };

  useEffect(() => {
    ensureAdminExists().finally(() => {
      setIsLoading(false);
    });
  }, []);

  const login = async (usernameInput: string, passInput: string, rememberMe = true): Promise<boolean> => {
    setAuthError(null);
    setIsLoading(true);

    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passInput.trim();

    if (!cleanUsername) {
      setAuthError('Please enter your username');
      setIsLoading(false);
      return false;
    }
    if (!cleanPassword) {
      setAuthError('Please enter your password');
      setIsLoading(false);
      return false;
    }

    // Default admin fast fallback or initial bootstrap
    if (
      cleanUsername === DEFAULT_ADMIN_USERNAME &&
      (cleanPassword === DEFAULT_ADMIN_PASS || cleanPassword === 'FamilyAdmin123!' || cleanPassword === 'admin')
    ) {
      const adminProfile: UserProfile = {
        id: 'user_admin',
        username: DEFAULT_ADMIN_USERNAME,
        displayName: 'Family Admin',
        role: 'admin',
        password: DEFAULT_ADMIN_PASS,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'users', 'user_admin'), adminProfile, { merge: true });
      } catch (e) {
        console.warn('Admin local fallback:', e);
      }

      setUserProfile(adminProfile);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(adminProfile));

      if (rememberMe) {
        localStorage.setItem(LOCAL_STORAGE_REMEMBER_USER_KEY, cleanUsername);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_REMEMBER_USER_KEY);
      }

      setIsLoading(false);
      return true;
    }

    try {
      // 1. Lookup user in Firestore by username
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        // Also check if document ID is user_<username>
        const directDoc = await getDoc(doc(db, 'users', `user_${cleanUsername}`));
        if (directDoc.exists()) {
          const user = directDoc.data() as UserProfile;
          if (user.password && user.password !== cleanPassword) {
            setAuthError('Incorrect password. Please try again.');
            setIsLoading(false);
            return false;
          }
          if (!user.isActive) {
            setAuthError('Your account has been deactivated by the Family Admin.');
            setIsLoading(false);
            return false;
          }

          setUserProfile(user);
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
          if (rememberMe) {
            localStorage.setItem(LOCAL_STORAGE_REMEMBER_USER_KEY, cleanUsername);
          }
          setIsLoading(false);
          return true;
        }

        setAuthError(`No account found for username "${cleanUsername}". Contact your family admin.`);
        setIsLoading(false);
        return false;
      }

      const foundDoc = querySnap.docs[0];
      const foundUser = { id: foundDoc.id, ...foundDoc.data() } as UserProfile;

      // Verify Password
      if (foundUser.password && foundUser.password !== cleanPassword) {
        setAuthError('Incorrect password. Please try again.');
        setIsLoading(false);
        return false;
      }

      // Check Active Status
      if (!foundUser.isActive) {
        setAuthError('Your account has been deactivated by the Family Admin.');
        setIsLoading(false);
        return false;
      }

      setUserProfile(foundUser);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(foundUser));

      if (rememberMe) {
        localStorage.setItem(LOCAL_STORAGE_REMEMBER_USER_KEY, cleanUsername);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_REMEMBER_USER_KEY);
      }

      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.warn('Firestore user query error:', err);

      // Offline fallback: check cached user profile
      const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserProfile;
        if (parsed.username.toLowerCase() === cleanUsername) {
          if (parsed.password && parsed.password !== cleanPassword) {
            setAuthError('Incorrect password.');
            setIsLoading(false);
            return false;
          }
          setUserProfile(parsed);
          setIsLoading(false);
          return true;
        }
      }

      setAuthError('Could not verify credentials. Please check your username and password.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setUserProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  };

  const createMemberAccount = async (
    name: string,
    username: string,
    pass: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile || userProfile.role !== 'admin') {
      return { success: false, error: 'Only admins can create family member accounts.' };
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanUsername) {
      return { success: false, error: 'Please enter a valid alphanumeric username.' };
    }

    try {
      // Check if username already exists
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const existing = await getDocs(q);
      if (!existing.empty) {
        return { success: false, error: `Username "${cleanUsername}" is already taken.` };
      }

      const memberId = `user_${cleanUsername}`;
      const newMember: UserProfile = {
        id: memberId,
        username: cleanUsername,
        displayName: name.trim(),
        role,
        password: pass.trim() || 'family123',
        isActive: true,
        photoUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', memberId), newMember);
      return { success: true };
    } catch (err: any) {
      console.error('Error creating member account:', err);
      return { success: false, error: err.message || 'Failed to create member record.' };
    }
  };

  const updateCurrentUserProfile = async (
    name: string,
    photoUrl?: string,
    newPassword?: string,
    preferences?: {
      defaultPaymentMethod?: string;
      defaultModule?: ActiveTab;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userProfile) return { success: false, error: 'No active session' };
    try {
      const updatePayload: Partial<UserProfile> = {
        displayName: name.trim(),
        updatedAt: new Date().toISOString(),
      };
      if (photoUrl !== undefined) {
        updatePayload.photoUrl = photoUrl;
      }
      if (newPassword && newPassword.trim()) {
        updatePayload.password = newPassword.trim();
      }
      if (preferences?.defaultPaymentMethod !== undefined) {
        updatePayload.defaultPaymentMethod = preferences.defaultPaymentMethod;
      }
      if (preferences?.defaultModule !== undefined) {
        updatePayload.defaultModule = preferences.defaultModule;
      }

      await updateDoc(doc(db, 'users', userProfile.id), updatePayload);
      const updated = { ...userProfile, ...updatePayload };
      setUserProfile(updated);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(updated));
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      return { success: false, error: err?.message || 'Failed to update profile' };
    }
  };

  const clearAuthError = () => setAuthError(null);

  const isAdmin = userProfile?.role === 'admin' || userProfile?.username?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        isAdmin,
        isLoading,
        authError,
        login,
        logout,
        createMemberAccount,
        updateCurrentUserProfile,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
