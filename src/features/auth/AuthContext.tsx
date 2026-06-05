import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { auth, db, googleProvider, twitterProvider } from '../../lib/firebase';
import { useUserStore } from '../../store/userStore';

interface AuthContextType {
  user: User | null;
  userData: Record<string, any> | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithTwitter: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser && (!currentUser.email || currentUser.emailVerified)) {
        const userRef = doc(db, 'users', currentUser.uid);

        // 1. Ensure user profile document exists in Firestore
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            const defaultProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              bits: 250,
              xp: 500,
              level: 1,
              streak: 1,
              archetype: '',
              roadmapComplete: false,
              scanComplete: false,
              lastVisit: serverTimestamp(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(userRef, defaultProfile);
          }
        } catch (error) {
          console.error("Failed to check/create user doc:", error);
        }

        // 2. Subscribe to real-time updates of the user profile document
        unsubscribeSnapshot = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setUserData(data);

            // Sync to local storage and state store reactively
            if (data.archetype) {
              localStorage.setItem('crypdo_archetype', data.archetype);
              useUserStore.getState().setArchetype(data.archetype);
            }
            if (data.traits) {
              useUserStore.getState().setTraits(data.traits);
            }
            if (data.roadmapComplete) {
              localStorage.setItem('crypdo_roadmap_complete', 'true');
              useUserStore.getState().setProfileFlag('hasRoadmapStarted', true);
            }
            if (data.scanComplete) {
              localStorage.setItem('crypdo_scan_complete', 'true');
              useUserStore.getState().setProfileFlag('scanCount', 1);
            }
            window.dispatchEvent(new Event('storage'));
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        });

      } else {
        setUserData(null);
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  async function signInWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Login failed:", error);
    }
  }

  async function signInWithTwitter() {
    try {
      await signInWithPopup(auth, twitterProvider);
    } catch (error) {
      console.error("Twitter Login failed:", error);
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      // Clear all local progress markers
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('crypdo_') && key !== 'crypdo_onboarding_complete') {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      useUserStore.getState().resetStore();
      setUserData(null);
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, loading, signInWithGoogle, signInWithTwitter, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return context;
};
