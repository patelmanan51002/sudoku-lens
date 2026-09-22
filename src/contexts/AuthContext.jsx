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
    const user = await appSignUp(email, password, displayName);
    setCurrentUser(user);
    return user;
  };

  const login = async (email, password) => {
    const user = await appSignIn(email, password);
    setCurrentUser(user);
    return user;
  };

  const logout = async () => {
    await appSignOut();
    setCurrentUser(null);
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
