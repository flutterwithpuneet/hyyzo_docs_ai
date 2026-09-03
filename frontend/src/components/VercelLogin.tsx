"use client";

import React, { useState } from "react";
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  isRealFirebaseConfigured
} from "@/lib/firebase";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";

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

export default function VercelLogin({ onLoginSuccess, theme = "dark" }: VercelLoginProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        // Instant Demo / Local Auth simulation when Firebase keys are not populated yet
        await new Promise((resolve) => setTimeout(resolve, 800));
        const demoUser: AuthUser = {
          uid: "usr_" + Math.random().toString(36).substring(2, 9),
          email: email,
          displayName: name || email.split("@")[0] || "Demo Developer",
          photoURL: null
        };
        localStorage.setItem("hyyzo_auth_user", JSON.stringify(demoUser));
        setSuccessMsg("Signed in successfully!");
        setTimeout(() => onLoginSuccess(demoUser), 600);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Authentication failed.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
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
        const res = await signInWithPopup(auth, provider);
        const u = res.user;
        const authUser: AuthUser = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || "Google User",
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
      console.error("Google Auth error:", err);
      setErrorMsg(err.message || "Google sign-in was cancelled or failed.");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen w-screen flex flex-col justify-center items-center px-4 relative overflow-hidden ${
      isDark ? "bg-[#0A0C10] text-[#EDEDED]" : "bg-[#FAFAFA] text-[#171717]"
    }`}>
      
      {/* Vercel Ambient Gradient Aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/15 via-indigo-500/10 to-transparent blur-[80px] pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 animate-in fade-in duration-300">
        
        {/* Vercel Brand Geometric Logo & Title */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-black border border-white/20 flex items-center justify-center text-white shadow-xl shadow-blue-500/10 mb-4 group transition hover:scale-105">
            {/* Vercel Triangle Icon with Hyyzo Spark */}
            <svg width="24" height="24" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M38 0L76 65H0L38 0Z" fill="white" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "login" ? "Sign in to Hyyzo Docs AI" : "Create your account"}
          </h1>
          <p className="text-xs mt-1.5 opacity-60">
            Intelligent RAG assistant with Firebase Authentication
          </p>
        </div>

        {/* Auth Glassmorphism Card */}
        <div className={`p-7 rounded-2xl border backdrop-blur-xl shadow-2xl ${
          isDark
            ? "bg-[#11141D]/90 border-[#242834] shadow-black/80"
            : "bg-white/95 border-[#EAEAEA] shadow-zinc-300/50"
        }`}>
          
          {/* Status Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] ${
              isDark
                ? "bg-[#181B26] border-[#2A2E3D] hover:bg-[#202534] text-white hover:border-white/20"
                : "bg-white border-[#E5E7EB] hover:bg-zinc-50 text-zinc-800 shadow-xs"
            }`}
          >
            {/* Google G Logo SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className={`flex-1 border-t ${isDark ? "border-[#242834]" : "border-[#E5E7EB]"}`} />
            <span className="px-3 text-[11px] uppercase tracking-wider opacity-40 font-mono">OR</span>
            <div className={`flex-1 border-t ${isDark ? "border-[#242834]" : "border-[#E5E7EB]"}`} />
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-[11px] font-medium opacity-70 mb-1">Full Name</label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                  isDark ? "bg-[#0D0F16] border-[#242834] text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
                }`}>
                  <User className="w-3.5 h-3.5 opacity-40" />
                  <input
                    type="text"
                    required
                    placeholder="Puneet Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-transparent border-none outline-none w-full placeholder:opacity-40"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium opacity-70 mb-1">Email Address</label>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                isDark ? "bg-[#0D0F16] border-[#242834] text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
              }`}>
                <Mail className="w-3.5 h-3.5 opacity-40" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-transparent border-none outline-none w-full placeholder:opacity-40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium opacity-70 mb-1">Password</label>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                isDark ? "bg-[#0D0F16] border-[#242834] text-white" : "bg-zinc-50 border-zinc-200 text-zinc-900"
              }`}>
                <Lock className="w-3.5 h-3.5 opacity-40" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent border-none outline-none w-full placeholder:opacity-40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-200 mt-4 active:scale-[0.98] ${
                isDark
                  ? "bg-white text-black hover:bg-zinc-200 shadow-md shadow-white/10"
                  : "bg-black text-white hover:bg-zinc-800 shadow-md shadow-black/10"
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Toggle Login / Sign up Switcher */}
        <div className="text-center mt-5 text-xs">
          {mode === "login" ? (
            <p className="opacity-70">
              Don't have an account?{" "}
              <button
                onClick={() => { setMode("signup"); setErrorMsg(null); }}
                className="font-semibold text-blue-400 hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="opacity-70">
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setErrorMsg(null); }}
                className="font-semibold text-blue-400 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] opacity-40 mt-8">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Protected by Firebase Auth & Google Identity</span>
        </div>

      </div>
    </div>
  );
}
