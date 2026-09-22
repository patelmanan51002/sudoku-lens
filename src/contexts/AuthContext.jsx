import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  appSignUp,
  appSignIn,
  appSignOut,
  appResetPassword,
  appUpdateProfile,
  appChangePassword,
  appDeleteAccount,
  generateAccountSyncPayload,
  importAccountSyncPayload,
  onAppAuthStateChanged,
  isFirebaseConfigured,
  saveFirebaseConfig
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

  const updateProfile = async (displayName) => {
    const updated = await appUpdateProfile(displayName);
    setCurrentUser(updated);
    return updated;
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await appChangePassword(currentPassword, newPassword);
  };

  const deleteAccount = async (password) => {
    const res = await appDeleteAccount(password);
    setCurrentUser(null);
    return res;
  };

  const generateSyncCode = (puzzles = []) => {
    return generateAccountSyncPayload(currentUser, puzzles);
  };

  const importSyncCode = (rawPayload) => {
    const user = importAccountSyncPayload(rawPayload);
    setCurrentUser(user);
    return user;
  };

  const setFirebaseConfig = (config) => {
    saveFirebaseConfig(config);
    window.location.reload();
  };

  const value = {
    currentUser,
    isCloudReady: isFirebaseConfigured,
    signup,
    login,
    logout,
    resetPassword,
    updateProfile,
    changePassword,
    deleteAccount,
    generateSyncCode,
    importSyncCode,
    setFirebaseConfig
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
