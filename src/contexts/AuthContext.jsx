import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  appSignUp,
  appSignIn,
  appSignOut,
  appResetPassword,
  onAppAuthStateChanged,
  isFirebaseConfigured
} from '../services/firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAppAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, displayName) => {
    return await appSignUp(email, password, displayName);
  };

  const login = async (email, password) => {
    return await appSignIn(email, password);
  };

  const logout = async () => {
    return await appSignOut();
  };

  const resetPassword = async (email) => {
    return await appResetPassword(email);
  };

  const value = {
    currentUser,
    isCloudReady: isFirebaseConfigured,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
