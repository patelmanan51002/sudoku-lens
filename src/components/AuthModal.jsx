import React, { useState } from 'react';
import { X, Lock, Mail, User, Cloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const { login, signup, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || successMsg) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    // Basic validation
    if (!email.trim()) {
      setErrorMsg('Please enter your email or user ID.');
      return;
    }

    if (isForgot) {
      try {
        setLoading(true);
        const msg = await resetPassword(email);
        setSuccessMsg(msg || 'Password reset link sent to your email.');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to send password reset.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        const user = await signup(email, password, displayName);
        const name = user?.displayName || displayName || email.split('@')[0];
        const msg = `🎉 Account created successfully! Welcome, ${name}!`;
        setSuccessMsg(msg);
        if (onAuthSuccess) onAuthSuccess(msg);
      } else {
        const user = await login(email, password);
        const name = user?.displayName || email.split('@')[0];
        const msg = `✅ Logged in successfully! Welcome back, ${name}!`;
        setSuccessMsg(msg);
        if (onAuthSuccess) onAuthSuccess(msg);
      }
      setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
        setPassword('');
        setConfirmPassword('');
        onClose();
      }, 1200);
    } catch (err) {
      let friendly = err.message;
      if (friendly.includes('auth/invalid-credential') || friendly.includes('auth/wrong-password')) {
        friendly = 'Incorrect email or password.';
      } else if (friendly.includes('auth/email-already-in-use')) {
        friendly = 'An account with this email already exists.';
      } else if (friendly.includes('auth/invalid-email')) {
        friendly = 'Please enter a valid email address.';
      }
      setErrorMsg(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-pop relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Icon & Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner mb-3">
            <Cloud className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {isForgot ? 'Reset Password' : isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isForgot
              ? 'Enter your email to receive a password reset link'
              : 'Save and continue your Sudoku puzzles seamlessly across any device'}
          </p>
        </div>

        {/* Tab switch between Sign In and Sign Up */}
        {!isForgot && (
          <div className="flex p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && !isForgot && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Your Name / Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Manan"
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address / ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {!isForgot && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgot(true);
                      setErrorMsg(null);
                    }}
                    className="text-[11px] text-blue-600 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {isSignUp && !isForgot && (
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-2 animate-pop">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center space-x-2 animate-pop">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || Boolean(successMsg)}
            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 mt-2 ${
              successMsg
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
            }`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : successMsg ? (
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Success!</span>
              </span>
            ) : isForgot ? (
              <span>Send Reset Email</span>
            ) : isSignUp ? (
              <span>Create Account</span>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {isForgot && (
          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setIsForgot(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              ← Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
