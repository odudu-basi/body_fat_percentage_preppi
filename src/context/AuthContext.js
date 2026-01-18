import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  supabase, 
  signIn as supabaseSignIn, 
  signUp as supabaseSignUp, 
  signOut as supabaseSignOut,
  getSession,
  getCurrentUser,
  getUserProfile,
  upsertUserProfile,
  onAuthStateChange 
} from '../services/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const currentSession = await getSession();
        setSession(currentSession);
        
        if (currentSession?.user) {
          setUser(currentSession.user);
          // Fetch user profile
          const userProfile = await getUserProfile(currentSession.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);
      
      if (newSession?.user) {
        setUser(newSession.user);
        // Fetch updated profile
        try {
          const userProfile = await getUserProfile(newSession.user.id);
          setProfile(userProfile);
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign up handler
  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true);
      const data = await supabaseSignUp(email, password, metadata);
      
      // Create initial profile if sign up successful
      if (data.user) {
        const initialProfile = {
          id: data.user.id,
          email: data.user.email,
          ...metadata,
          created_at: new Date().toISOString(),
        };
        await upsertUserProfile(initialProfile);
        setProfile(initialProfile);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign in handler
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const data = await supabaseSignIn(email, password);
      
      if (data.user) {
        const userProfile = await getUserProfile(data.user.id);
        setProfile(userProfile);
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const signOut = async () => {
    try {
      setLoading(true);
      await supabaseSignOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Update profile handler
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const updatedProfile = {
        ...profile,
        ...updates,
        id: user.id,
        updated_at: new Date().toISOString(),
      };
      
      const result = await upsertUserProfile(updatedProfile);
      setProfile(result);
      return { data: result, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  // Refresh profile
  const refreshProfile = async () => {
    try {
      if (!user) return;
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
      return userProfile;
    } catch (error) {
      console.error('Refresh profile error:', error);
      return null;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    initialized,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    supabase, // Expose supabase client for direct access if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
