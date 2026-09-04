"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  isRealFirebaseConfigured
} from "@/lib/firebase";
import {
  initializeSession,
  verifyMobileRegistrationAndRateLimit,
  recordOtpAttemptToFirestore,
  registerAuthorizedUserInFirestore,
  cleanPhoneNumber
} from "@/lib/firestoreService";
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Smartphone,
  UserPlus,
  X,
  Lock
} from "lucide-react";

export interface AuthUser {
  uid: string;
  email: string | null;
  phoneNumber?: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface VercelLoginProps {
  onLoginSuccess: (user: AuthUser) => void;
  theme?: "dark" | "light";
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function VercelLogin({ onLoginSuccess }: VercelLoginProps) {
  // Mobile OTP States (Fixed to Indian +91)
  const countryCode = "+91";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "otp">("phone");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Admin Quick Authorize / Register Modal
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPhoneInput, setAdminPhoneInput] = useState("");
  const [adminNameInput, setAdminNameInput] = useState("");
  const [adminPasskey, setAdminPasskey] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // ignore cleanup errors
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (typeof window === "undefined" || !auth) return null;
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved
          },
          "expired-callback": () => {
            setErrorMsg("Security verification expired. Please try sending OTP again.");
          }
        });
      }
      return window.recaptchaVerifier;
    } catch (err) {
      console.error("Recaptcha initialization error:", err);
      return null;
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanNumber = phoneNumber.trim().replace(/[\s-]/g, "");
    if (!cleanNumber || cleanNumber.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    const fullPhoneNumber = countryCode.trim() + cleanNumber;
    setLoading(true);

    try {
      // -------------------------------------------------------------
      // 1. Check Registration & 24h Rate Limit in Firestore
      // -------------------------------------------------------------
      const check = await verifyMobileRegistrationAndRateLimit(fullPhoneNumber);
      
      if (!check.allowed) {
        setErrorMsg(check.message || "First need to register via admin to get access.");
        setLoading(false);
        return;
      }

      // -------------------------------------------------------------
      // 2. Proceed to send SMS OTP via Firebase Phone Auth
      // -------------------------------------------------------------
      if (isRealFirebaseConfigured && auth) {
        const appVerifier = setupRecaptcha();
        if (!appVerifier) {
          throw new Error("Could not initialize security verification. Please refresh the page.");
        }

        const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
        window.confirmationResult = confirmation;
        setConfirmationResult(confirmation);
        
        // Record attempt in Firestore audit logs
        await recordOtpAttemptToFirestore(fullPhoneNumber);

        setOtpStep("otp");
        setResendTimer(45);
        const remainingText = check.attemptsRemaining !== undefined
          ? ` (${check.attemptsRemaining} OTP request${check.attemptsRemaining === 1 ? "" : "s"} remaining today)`
          : "";
        setSuccessMsg(`OTP sent successfully to ${fullPhoneNumber}${remainingText}`);
      } else {
        // Instant Demo Mode fallback for local testing
        await recordOtpAttemptToFirestore(fullPhoneNumber);
        await new Promise((resolve) => setTimeout(resolve, 800));
        setOtpStep("otp");
        setResendTimer(30);
        setSuccessMsg(`(Demo) Verification code sent to ${fullPhoneNumber}. (Enter any 6 digits e.g. 123456)`);
      }
    } catch (err: any) {
      console.error("Phone Auth error:", err);
      let msg = err.message || "Failed to send OTP.";
      if (err.code === "auth/invalid-phone-number") {
        msg = "The phone number format is invalid. Please enter 10 digits.";
      } else if (err.code === "auth/too-many-requests") {
        msg = "Too many requests. Please wait a few minutes before requesting another OTP.";
      } else if (err.code === "auth/quota-exceeded") {
        msg = "SMS quota exceeded for today. Please try signing in with Google.";
      } else if (err.code === "auth/missing-phone-number") {
        msg = "Please provide a valid phone number.";
      }
      setErrorMsg(msg);
      // Reset recaptcha verifier on error so user can retry
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (_) {}
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);

    try {
      if (isRealFirebaseConfigured && confirmationResult) {
        const result = await confirmationResult.confirm(cleanOtp);
        const u = result.user;
        const authUser: AuthUser = {
          uid: u.uid,
          email: u.email,
          phoneNumber: u.phoneNumber,
          displayName: u.displayName || u.phoneNumber || "Hyyzo User",
          photoURL: u.photoURL
        };
        initializeSession(authUser.uid, {
          phoneNumber: authUser.phoneNumber,
          email: authUser.email,
          displayName: authUser.displayName
        });
        localStorage.setItem("hyyzo_auth_user", JSON.stringify(authUser));
        setSuccessMsg("Mobile verified successfully! Logging you in...");
        setTimeout(() => onLoginSuccess(authUser), 600);
      } else if (!isRealFirebaseConfigured) {
        // Demo mode verification
        await new Promise((resolve) => setTimeout(resolve, 600));
        const fullPhoneNumber = countryCode + phoneNumber;
        const demoUser: AuthUser = {
          uid: "phone_usr_" + Math.random().toString(36).substring(2, 9),
          email: null,
          phoneNumber: fullPhoneNumber,
          displayName: `User (${fullPhoneNumber})`,
          photoURL: null
        };
        initializeSession(demoUser.uid, {
          phoneNumber: demoUser.phoneNumber,
          email: demoUser.email,
          displayName: demoUser.displayName
        });
        localStorage.setItem("hyyzo_auth_user", JSON.stringify(demoUser));
        setSuccessMsg("Mobile verified successfully! Logging in...");
        setTimeout(() => onLoginSuccess(demoUser), 600);
      } else {
        throw new Error("No active OTP session found. Please click 'Resend OTP'.");
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      let msg = err.message || "Invalid OTP code.";
      if (err.code === "auth/invalid-verification-code") {
        msg = "The verification code is incorrect. Please check and try again.";
      } else if (err.code === "auth/code-expired") {
        msg = "The verification code has expired. Please request a new OTP.";
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
          phoneNumber: u.phoneNumber,
          displayName: u.displayName || u.email?.split("@")[0] || "Google User",
          photoURL: u.photoURL
        };
        initializeSession(authUser.uid, {
          phoneNumber: authUser.phoneNumber,
          email: authUser.email,
          displayName: authUser.displayName
        });
        localStorage.setItem("hyyzo_auth_user", JSON.stringify(authUser));
        setSuccessMsg("Signed in with Google!");
        setTimeout(() => onLoginSuccess(authUser), 600);
      } else {
        // Seamless Google Auth Demo
        await new Promise((resolve) => setTimeout(resolve, 700));
        const demoGoogleUser: AuthUser = {
          uid: "g_usr_" + Math.random().toString(36).substring(2, 9),
          email: "alex.developer@hyyzo.com",
          phoneNumber: "+91 9876543210",
          displayName: "Alex Developer",
          photoURL: null
        };
        initializeSession(demoGoogleUser.uid, {
          phoneNumber: demoGoogleUser.phoneNumber,
          email: demoGoogleUser.email,
          displayName: demoGoogleUser.displayName
        });
        localStorage.setItem("hyyzo_auth_user", JSON.stringify(demoGoogleUser));
        setSuccessMsg("Signed in with Google!");
        setTimeout(() => onLoginSuccess(demoGoogleUser), 600);
      }
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
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

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);

    const clean = adminPhoneInput.trim().replace(/[\s-]/g, "");
    if (!clean || clean.length < 10) {
      setAdminFeedback({ type: "error", text: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setAdminLoading(true);
    try {
      const res = await registerAuthorizedUserInFirestore(
        clean,
        adminNameInput || "Team Member",
        "member"
      );
      if (res.success) {
        setAdminFeedback({ type: "success", text: `Registered ${cleanPhoneNumber(clean)} successfully in Firestore!` });
        setPhoneNumber(clean.replace(/^\+91/, ""));
        setTimeout(() => {
          setShowAdminModal(false);
          setAdminFeedback(null);
        }, 1200);
      } else {
        setAdminFeedback({ type: "error", text: res.message });
      }
    } catch (e: any) {
      setAdminFeedback({ type: "error", text: e.message || "Failed to register number." });
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[#060913] text-[#F1F5F9] selection:bg-blue-500 selection:text-white">
      
      {/* Invisible container for Firebase Phone Auth Recaptcha */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />

      {/* Background Deep Space & Cosmic Glow Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Radial ambient glow top */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-[#1d4ed8]/20 via-[#0369a1]/10 to-transparent blur-[110px]" />
        
        {/* Subtle mesh background grid */}
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
            Sign in to access document-grounded intelligence
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
          <span className="text-xs font-medium text-slate-400 tracking-wider">OR CONTINUE WITH OTP</span>
          <div className="h-[1px] w-8 bg-slate-600/40" />
        </div>

        {/* Main Phone OTP Card */}
        <div className="p-6 sm:p-7 rounded-2xl bg-[#0b101d]/90 border border-[#1b253d] backdrop-blur-xl shadow-[0_15px_45px_rgba(0,0,0,0.65)] relative overflow-hidden">
          
          {/* Subtle card top edge glow */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#38bdf8]/40 to-transparent" />

          {/* Status Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Enter Mobile Number */}
          {otpStep === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Mobile Phone Number</span>
                </label>
                
                <div className="flex gap-2">
                  {/* Fixed Indian Country Code Prefix */}
                  <div className="bg-[#070b15] border-2 border-[#1e40af] rounded-xl px-3.5 py-3 text-sm text-white font-mono flex items-center gap-1.5 shadow-[0_0_12px_rgba(30,64,175,0.2)] select-none shrink-0">
                    <span className="text-base leading-none">🇮🇳</span>
                    <span className="font-semibold text-slate-200">+91</span>
                  </div>

                  {/* Phone Input (10 Digits) */}
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                      className="w-full bg-[#070b15] border-2 border-[#1e40af] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all font-mono tracking-wider shadow-[0_0_12px_rgba(30,64,175,0.2)]"
                      autoFocus
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Enter 10-digit Indian mobile number to receive 6-digit OTP via SMS.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !phoneNumber.trim()}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-[#0284c7] via-[#1d4ed8] to-[#2563eb] hover:from-[#0369a1] hover:via-[#1e40af] hover:to-[#1d4ed8] flex items-center justify-center gap-2 shadow-[0_4px_22px_rgba(37,99,235,0.4)] hover:shadow-[0_4px_28px_rgba(37,99,235,0.65)] transition-all duration-200 mt-5 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: Enter 6-digit OTP */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Enter 6-Digit OTP</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep("phone");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    Change Number
                  </button>
                </div>

                <div className="text-xs text-slate-400 mb-3">
                  Sent to <span className="font-mono text-white font-semibold">{countryCode} {phoneNumber}</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-[#070b15] border-2 border-[#1e40af] focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20 rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] font-mono text-white placeholder-slate-600 outline-none transition-all shadow-[0_0_12px_rgba(30,64,175,0.2)]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Verify OTP Button */}
              <button
                type="submit"
                disabled={loading || otpCode.trim().length < 6}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 flex items-center justify-center gap-2 shadow-[0_4px_22px_rgba(16,185,129,0.35)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.5)] transition-all duration-200 mt-4 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend Code Section */}
              <div className="flex items-center justify-center pt-2 text-xs">
                {resendTimer > 0 ? (
                  <span className="text-slate-500">
                    Resend OTP in <span className="font-mono text-slate-300 font-semibold">{resendTimer}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    disabled={loading}
                    className="text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Resend OTP Code</span>
                  </button>
                )}
              </div>
            </form>
          )}

        </div>

        {/* Admin Quick Action Link */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setAdminPhoneInput(phoneNumber);
              setAdminFeedback(null);
              setShowAdminModal(true);
            }}
            className="text-[11px] text-slate-500 hover:text-slate-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3 text-slate-500" />
            <span>Admin: Register new mobile number</span>
          </button>
        </div>

      </div>

      {/* Admin Authorization / Quick Registration Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0c1222] border border-[#23314e] shadow-2xl relative">
            <button
              onClick={() => setShowAdminModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Register Mobile in Firestore</h3>
                <p className="text-xs text-slate-400">Authorizes user in <code className="font-mono text-sky-300">registered_users</code> collection.</p>
              </div>
            </div>

            {adminFeedback && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                adminFeedback.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
              }`}>
                {adminFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{adminFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleAdminRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="bg-[#070b15] border border-[#1e40af] rounded-xl px-3 py-2 text-xs text-white font-mono flex items-center">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98765 43210"
                    value={adminPhoneInput}
                    onChange={(e) => setAdminPhoneInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                    className="flex-1 bg-[#070b15] border border-[#1e40af] focus:border-[#38bdf8] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name / Member Name</label>
                <input
                  type="text"
                  placeholder="Puneet Sharma"
                  value={adminNameInput}
                  onChange={(e) => setAdminNameInput(e.target.value)}
                  className="w-full bg-[#070b15] border border-[#1e40af] focus:border-[#38bdf8] rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminLoading || adminPhoneInput.length < 10}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {adminLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Register in Firestore</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
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
