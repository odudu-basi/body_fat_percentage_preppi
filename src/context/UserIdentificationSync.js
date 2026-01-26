import React, { useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

// Conditionally import Superwall only in production
let useUser;

if (!isExpoGo) {
  const superwallModule = require('expo-superwall');
  useUser = superwallModule.useUser;
}

/**
 * User Identification Sync
 * Syncs user authentication state between AuthContext and Superwall
 *
 * When a user logs in, identifies them with Superwall using their user ID
 * When a user logs out, signs them out from Superwall
 */
const UserIdentificationSync = ({ children }) => {
  // In Expo Go, skip user identification
  if (isExpoGo) {
    console.log('[UserIdentificationSync] 🔧 DEV MODE: Skipping sync (Expo Go)');
    return <>{children}</>;
  }

  const { user } = useAuth();
  const { identify, signOut } = useUser();
  const previousUserId = useRef(null);

  useEffect(() => {
    const currentUserId = user?.id;

    // User logged in or switched accounts
    if (currentUserId && currentUserId !== previousUserId.current) {
      console.log('[UserIdentificationSync] User logged in, identifying with Superwall:', currentUserId);

      identify(currentUserId)
        .then(() => {
          console.log('[UserIdentificationSync] User identified successfully');
          previousUserId.current = currentUserId;
        })
        .catch((error) => {
          console.error('[UserIdentificationSync] Failed to identify user:', error);
        });
    }
    // User logged out
    else if (!currentUserId && previousUserId.current) {
      console.log('[UserIdentificationSync] User logged out, signing out from Superwall');

      signOut();
      previousUserId.current = null;
    }
  }, [user?.id, identify, signOut]);

  return <>{children}</>;
};

export default UserIdentificationSync;
