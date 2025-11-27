import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, profile: Omit<UserProfile, 'id'>) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateMealState: (mealState: 'fasted' | 'light' | 'heavy') => Promise<void>;
  updateProfilePicture: (profilePictureUri: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      // If Firebase not configured, check AsyncStorage for local user
      const loadLocalUser = async () => {
        try {
          const storedProfile = await AsyncStorage.getItem('userProfile');
          if (storedProfile) {
            const profile = JSON.parse(storedProfile) as UserProfile;
            setUserProfile(profile);
            // Create a mock Firebase user object
            setUser({ uid: profile.id } as FirebaseUser);
          }
        } catch (error) {
          console.error('Error loading local user:', error);
        }
        setLoading(false);
      };
      loadLocalUser();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && db) {
        // Load user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            setUserProfile(profileData);
            // Also save to AsyncStorage for offline access
            await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
        await AsyncStorage.removeItem('userProfile');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (
    email: string,
    password: string,
    profile: Omit<UserProfile, 'id'>
  ) => {
    // Fallback mode: Use local storage if Firebase not configured
    if (!isFirebaseConfigured || !auth || !db) {
      const userProfileData: UserProfile = {
        ...profile,
        id: `local_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Save to AsyncStorage only
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfileData));
      setUserProfile(userProfileData);
      // Create a mock Firebase user for local mode
      setUser({ uid: userProfileData.id } as FirebaseUser);
      return;
    }

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user profile in Firestore
      const userProfileData: UserProfile = {
        ...profile,
        id: firebaseUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userProfileData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Save to AsyncStorage
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfileData));
      setUserProfile(userProfileData);
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured. Please set up Firebase config in src/config/firebase.ts');
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle loading the profile
    } catch (error: any) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear state first (before async operations)
      setUser(null);
      setUserProfile(null);
      
      // Sign out from Firebase if configured
      if (isFirebaseConfigured && auth) {
        try {
          await signOut(auth);
        } catch (firebaseError) {
          console.error('Firebase sign out error:', firebaseError);
          // Continue with local cleanup even if Firebase sign out fails
        }
      }
      
      // Clear all storage
      await AsyncStorage.multiRemove([
        'userProfile',
        'user',
        'sessions',
        'friends',
        'groups',
      ]);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear state even if storage operations fail
      setUser(null);
      setUserProfile(null);
      throw error;
    }
  };

  const updateMealState = async (mealState: 'fasted' | 'light' | 'heavy') => {
    if (!user || !userProfile) throw new Error('User not authenticated');

    try {
      const updatedProfile = {
        ...userProfile,
        mealState,
        updatedAt: new Date(),
      };

      // Update Firestore if configured
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'users', user.uid), {
          ...updatedProfile,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      // Always update local storage
      setUserProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating meal state:', error);
      throw error;
    }
  };

  const updateProfilePicture = async (profilePictureUri: string) => {
    if (!user || !userProfile) throw new Error('User not authenticated');

    try {
      const updatedProfile = {
        ...userProfile,
        profilePictureUri,
        updatedAt: new Date(),
      };

      // Update Firestore if configured
      if (isFirebaseConfigured && db) {
        await setDoc(doc(db, 'users', user.uid), {
          ...updatedProfile,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      // Always update local storage
      setUserProfile(updatedProfile);
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signUp,
        login,
        logout,
        updateMealState,
        updateProfilePicture,
        isAuthenticated: !!(user || userProfile),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

