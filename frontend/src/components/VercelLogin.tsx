"use client";

import React, { useState } from "react";
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  isRealFirebaseConfigured
} from "@/lib/firebase";
import {
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound
} from "lucide-react";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface VercelLoginProps {
  onLoginSuccess: (user: AuthUser) => void;
  theme?: "dark" | "light";
}

export default function VercelLogin({ onLoginSuccess }: VercelLoginProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please provide both email and password.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRealFirebaseConfigured && auth) {
        if (mode === "signup") {
          const userCred = await createUserWithEmailAndPassword(auth, email, password);
          const u = userCred.user;
          const authUser: AuthUser = {
            uid: u.uid,
            email: u.email,
            displayName: name || u.email?.split("@")[0] || "Hyyzo User",
            photoURL: u.photoURL
          };
          setSuccessMsg("Account created successfully!");
          setTimeout(() => onLoginSuccess(authUser), 600);
        } else {
          const userCred = await signInWithEmailAndPassword(auth, email, password);
          const u = userCred.user;
          const authUser: AuthUser = {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName || u.email?.split("@")[0] || "Hyyzo User",
            photoURL: u.photoURL
          };
          setSuccessMsg("Welcome back!");
          setTimeout(() => onLoginSuccess(authUser), 600);
        }
      } else {
        // Instant Demo / Local Auth simulation when Firebase is in offline mode
        await new Promise((resolve) => setTimeout(resolve, 650));
        const demoUser: AuthUser = {
          uid: "usr_" + Math.random().toString(36).substring(2, 9),
          email: email,
          displayName: name || email.split("@")[0] || "Hyyzo User",
          photoURL: null
        };
        localStorage.setItem("hyyzo_auth_user", JSON.stringify(demoUser));
        setSuccessMsg(mode === "signup" ? "Account created successfully!" : "Signed in successfully!");
        setTimeout(() => onLoginSuccess(demoUser), 600);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "An account with this email already exists.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isRealFirebaseConfigured && auth) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        const res = await signInWithPopup(auth, provider);
        const u = res.user;
        const authUser: AuthUser = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || u.email?.split("@")[0] || "Google User",
          photoURL: u.photoURL
        };
        setSuccessMsg("Signed in with Google!");
        setTimeout(() => onLoginSuccess(authUser), 600);
      } else {
        // Seamless Google Auth Demo
        await new Promise((resolve) => setTimeout(resolve, 700));
        const demoGoogleUser: AuthUser = {
          uid: "g_usr_" + Math.random().toString(36).substring(2, 9),
          email: "alex.developer@hyyzo.com",
          displayName: "Alex Developer",
          photoURL: null
        };
        localStorage.setItem("hyyzo_auth_user", JSON.stringify(demoGoogleUser));
        setSuccessMsg("Signed in with Google!");
        setTimeout(() => onLoginSuccess(demoGoogleUser), 600);
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        // User voluntarily closed the Google popup; do not treat as a hard failure
        console.info("Google sign-in popup was closed before completion.");
      } else if (err.code === "auth/popup-blocked") {
        setErrorMsg("Sign-in popup was blocked by your browser. Please allow popups for localhost.");
      } else if (err.code === "auth/cancelled-popup-request") {
        // Another popup request was opened
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMsg("This domain is not authorized in Firebase Console > Authentication > Settings > Authorized domains.");
      } else {
        console.error("Google Auth error:", err);
        setErrorMsg(err.message || "Google sign-in could not be completed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotMsg({ type: "error", text: "Please enter your work email." });
      return;
    }
    setForgotLoading(true);
    setForgotMsg(null);

    try {
      if (isRealFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, forgotEmail);
        setForgotMsg({ type: "success", text: "Password reset link sent to your email!" });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 600));
        setForgotMsg({ type: "success", text: "Password reset link sent to your email (Demo Mode)." });
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      let msg = err.message || "Failed to send reset email.";
      if (err.code === "auth/user-not-found") {
        msg = "No account found with this email.";
      }
      setForgotMsg({ type: "error", text: msg });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[#060913] text-[#F1F5F9] selection:bg-blue-500 selection:text-white">
      
      {/* Background Deep Space & Cosmic Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial ambient glow top */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-[#1d4ed8]/20 via-[#0369a1]/10 to-transparent blur-[110px]" />
        
        {/* Subtle mesh background grid / constellation lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#38bdf8" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>

        {/* Ambient neural nodes */}
        <div className="absolute top-1/4 right-[15%] w-2 h-2 rounded-full bg-cyan-400/40 blur-[1px] animate-pulse" />
        <div className="absolute bottom-1/3 left-[12%] w-2.5 h-2.5 rounded-full bg-blue-500/30 blur-[1px] animate-pulse delay-700" />
        <div className="absolute top-1/3 left-[18%] w-1.5 h-1.5 rounded-full bg-indigo-400/30 blur-[1px]" />
      </div>

      <div className="w-full max-w-[440px] relative z-10 my-8">
        
        {/* Header: Hyyzo Docs AI + Docs AI Icon Badge */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <h1 className="text-3xl sm:text-[34px] font-serif tracking-tight text-white font-normal select-none">
              Hyyzo Docs AI
            </h1>
            
            {/* Custom Docs AI Logo Badge */}
            <div className="relative inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-[#38bdf8]/60 bg-[#0c2340]/70 text-[#38bdf8] text-[10px] font-bold tracking-tight shadow-[0_0_10px_rgba(56,189,248,0.25)]">
              <div className="flex flex-col items-center leading-none">
                <span className="text-[9px] font-mono lowercase opacity-90">docs</span>
                <span className="text-[10px] font-mono uppercase font-black text-sky-300">AI</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-400 font-light tracking-wide">
            {mode === "login"
              ? "Sign in to access document-grounded intelligence"
              : "Create an account to access document-grounded intelligence"}
          </p>
        </div>

        {/* Top Google Sign-In Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#0f172a]/90 hover:bg-[#162038] border border-[#23314e] hover:border-[#38bdf8]/60 text-slate-100 text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200 shadow-md hover:shadow-blue-500/10 active:scale-[0.99] cursor-pointer group"
          >
            {/* Official Multi-Color Google G Logo */}
            <svg
              className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span className="tracking-wide">Continue with Google</span>
          </button>
        </div>

        {/* OR Divider */}
        <div className="flex items-center justify-center gap-3 my-5">
          <div className="h-[1px] w-8 bg-slate-600/40" />
          <span className="text-xs font-medium text-slate-400 tracking-wider">OR</span>
          <div className="h-[1px] w-8 bg-slate-600/40" />
        </div>

        {/* Main Auth Glass Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#0b101d]/90 border border-[#1b253d] backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.65)] relative overflow-hidden">
          
          {/* Subtle card top edge glow */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#38bdf8]/40 to-transparent" />

          {/* Status Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {/* Full Name field when registering */}
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Puneet Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#070b15] border-2 border-[#1e40af] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-[0_0_12px_rgba(30,64,175,0.2)]"
                  />
                </div>
              </div>
            )}

            {/* Work Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@hyyzo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#070b15] border-2 border-[#1e40af] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-[0_0_12px_rgba(30,64,175,0.2)]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#070b15] border-2 border-[#1e40af] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-[0_0_12px_rgba(30,64,175,0.2)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 opacity-75" />
                  ) : (
                    <Eye className="w-4 h-4 opacity-75" />
                  )}
                </button>
              </div>

              {/* Forgot Password Link (Only in Login Mode) */}
              {mode === "login" && (
                <div className="mt-2 text-left">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotMsg(null);
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[#0284c7] via-[#1d4ed8] to-[#2563eb] hover:from-[#0369a1] hover:via-[#1e40af] hover:to-[#1d4ed8] flex items-center justify-center gap-2 shadow-[0_4px_22px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_28px_rgba(37,99,235,0.65)] transition-all duration-200 mt-5 active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                  <span className="text-base leading-none">→</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Switcher: Need an account? Register here. */}
          <div className="text-center mt-6 text-xs text-slate-400">
            {mode === "login" ? (
              <p>
                Need an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                  }}
                  className="font-medium text-slate-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Register here.
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                  }}
                  className="font-medium text-slate-200 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Sign in here.
                </button>
              </p>
            )}
          </div>

        </div>

      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0c1222] border border-[#23314e] shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Reset your password</h3>
                <p className="text-xs text-slate-400">We'll send a password reset link to your email.</p>
              </div>
            </div>

            {forgotMsg && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                forgotMsg.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}>
                {forgotMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@hyyzo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-[#070b15] border-2 border-[#1e40af] focus:border-[#38bdf8] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all shadow-[0_0_10px_rgba(30,64,175,0.2)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-60"
                >
                  {forgotLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
