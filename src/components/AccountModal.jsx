import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Cloud,
  Smartphone,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  Loader2,
  Calendar,
  Layers,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/dateUtils';

export default function AccountModal({
  isOpen,
  onClose,
  currentUser,
  puzzles = [],
  onAccountDeleted,
  onToast
}) {
  const { updateProfile, changePassword, deleteAccount, generateSyncCode, isCloudReady, setFirebaseConfig } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'sync' | 'cloud' | 'danger'

  // Edit Name
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);

  // Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState(null);

  // Sync / Transfer
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Custom Firebase
  const [fbConfigText, setFbConfigText] = useState('');
  const [fbMsg, setFbMsg] = useState(null);

  // Delete Account
  const [deletePass, setDeletePass] = useState('');
  const [showDeletePass, setShowDeletePass] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Stats
  const totalPuzzles = puzzles.length;
  const finishedPuzzles = puzzles.filter((p) => p.status === 'Finished').length;

  // Generate mobile sync link
  const syncPayload = generateSyncCode(puzzles);
  const mobileSyncUrl = `${window.location.origin}${window.location.pathname}?sync=${syncPayload}`;

  // Handle Name Update
  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!displayName.trim() || nameLoading) return;
    setNameLoading(true);
    setNameMsg(null);
    try {
      await updateProfile(displayName.trim());
      setNameMsg({ type: 'success', text: 'Display name updated successfully!' });
      setTimeout(() => setNameMsg(null), 3000);
    } catch (err) {
      setNameMsg({ type: 'error', text: err.message || 'Failed to update name.' });
    } finally {
      setNameLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passLoading) return;
    setPassMsg(null);

    if (!currentPassword) {
      setPassMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPassLoading(true);
    try {
      const msg = await changePassword(currentPassword, newPassword);
      setPassMsg({ type: 'success', text: msg || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPassMsg(null), 3500);
    } catch (err) {
      setPassMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setPassLoading(false);
    }
  };

  // Copy mobile sync link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileSyncUrl);
    setCopiedLink(true);
    if (onToast) onToast({ type: 'success', message: '📋 Mobile sync link copied to clipboard!' });
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Copy sync code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncPayload);
    setCopiedCode(true);
    if (onToast) onToast({ type: 'success', message: '📋 Sync code copied to clipboard!' });
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Handle Firebase Config Save
  const handleSaveFirebase = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(fbConfigText);
      if (!parsed.apiKey || !parsed.projectId) {
        throw new Error('Config must include at least apiKey and projectId.');
      }
      setFirebaseConfig(parsed);
      setFbMsg({ type: 'success', text: 'Firebase config applied! Reloading...' });
    } catch (err) {
      setFbMsg({ type: 'error', text: 'Invalid JSON config: ' + err.message });
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (!deletePass || deleteLoading) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteAccount(deletePass);
      if (onAccountDeleted) onAccountDeleted();
      onClose();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Please verify password.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 sm:p-7 max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 animate-pop relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {currentUser.displayName || 'My Account'}
            </h2>
            <p className="text-xs text-slate-500 truncate max-w-[240px] sm:max-w-xs">
              {currentUser.email}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-5 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all shrink-0 ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all shrink-0 flex items-center justify-center space-x-1 ${
              activeTab === 'sync'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Link Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all shrink-0 flex items-center justify-center space-x-1 ${
              activeTab === 'cloud'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex-1 py-1.5 px-2 rounded-lg transition-all shrink-0 text-rose-600 ${
              activeTab === 'danger'
                ? 'bg-rose-50 shadow-sm font-black'
                : 'text-rose-400 hover:text-rose-600'
            }`}
          >
            Danger
          </button>
        </div>

        {/* TAB 1: Profile & Edit Details */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Saved</div>
                  <div className="text-sm font-bold text-slate-800">{totalPuzzles} puzzles</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Completed</div>
                  <div className="text-sm font-bold text-slate-800">{finishedPuzzles} solved</div>
                </div>
              </div>
            </div>

            {/* Edit Display Name Form */}
            <form onSubmit={handleUpdateName} className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Display Name
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={nameLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-all flex items-center space-x-1"
                >
                  {nameLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save</span>}
                </button>
              </div>
              {nameMsg && (
                <div className={`text-xs font-semibold ${nameMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {nameMsg.text}
                </div>
              )}
            </form>

            <hr className="border-slate-100" />

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <span>Change Password</span>
              </div>

              {/* Current Password with Show/Hide toggle */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                    title={showCurrentPass ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password with Show/Hide toggle */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  New Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                    title={showNewPass ? 'Hide password' : 'Show password'}
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password with Show/Hide toggle */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                    title={showConfirmPass ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passMsg && (
                <div className={`text-xs font-semibold ${passMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {passMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5"
              >
                {passLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Update Password</span>}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Sync with Mobile Device */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs mb-1">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Link & Continue on Mobile / Tablet</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Because this app runs directly on GitHub Pages, use this 1-click sync link to instantly transfer your account credentials and all saved puzzles to your phone!
              </p>
            </div>

            {/* Option 1: Mobile Sync Link */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">1. Instant Mobile Link</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Copy this link and open it in your mobile browser (e.g. via WhatsApp, Email, or Notes). It will automatically sign you in and import all your puzzles!
              </p>
              <button
                onClick={handleCopyLink}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs ${
                  copiedLink
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                }`}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Mobile Sync Link'}</span>
              </button>
            </div>

            {/* Option 2: Text Sync Code */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800">2. Sync Code</span>
              <p className="text-[11px] text-slate-500">
                Or copy this sync code and paste it into the <b>"Sync Device"</b> tab on your phone's Sign In screen:
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  readOnly
                  value={syncPayload}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-500 truncate select-all"
                />
                <button
                  onClick={handleCopyCode}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    copiedCode
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Google Firebase Cloud */}
        {activeTab === 'cloud' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 p-3 rounded-2xl border bg-slate-50 border-slate-200">
              <Cloud className={`w-5 h-5 ${isCloudReady ? 'text-emerald-600' : 'text-amber-500'}`} />
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Status: {isCloudReady ? 'Google Firebase Connected ☁️' : 'Device-to-Device Sync Mode'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isCloudReady
                    ? 'All puzzles and accounts are synchronizing live with Firebase.'
                    : 'Accounts & puzzles synchronize via Link/Code. You can connect a free Firebase project below for live real-time cloud sync.'}
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveFirebase} className="space-y-2.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Firebase Project Config (JSON)
              </label>
              <textarea
                rows={4}
                value={fbConfigText}
                onChange={(e) => setFbConfigText(e.target.value)}
                placeholder={'{\n  "apiKey": "AIzaSy...",\n  "authDomain": "sudoku-app.firebaseapp.com",\n  "projectId": "sudoku-app"\n}'}
                className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {fbMsg && (
                <div className={`text-xs font-semibold ${fbMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {fbMsg.text}
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <a
                  href="https://console.firebase.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <span>Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Connect Firebase
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: Danger Zone - Delete Account */}
        {activeTab === 'danger' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Permanent Account Deletion</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Deleting your account will permanently remove your login credentials, cloud data, and all saved Sudoku puzzles from this device and the cloud. <b>This action cannot be undone.</b>
              </p>
            </div>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>I Want to Delete My Account</span>
              </button>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl border border-rose-300 space-y-3 animate-pop">
                <div className="text-xs font-bold text-slate-800">
                  Please enter your password to confirm deletion:
                </div>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showDeletePass ? 'text' : 'password'}
                    value={deletePass}
                    onChange={(e) => setDeletePass(e.target.value)}
                    placeholder="Enter account password"
                    required
                    className="w-full pl-9 pr-10 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePass(!showDeletePass)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 p-0.5"
                    tabIndex={-1}
                    title={showDeletePass ? 'Hide password' : 'Show password'}
                  >
                    {showDeletePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {deleteError && (
                  <div className="text-xs font-bold text-rose-600">
                    {deleteError}
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePass('');
                      setDeleteError(null);
                    }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || !deletePass}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5"
                  >
                    {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Delete Permanently</span>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
