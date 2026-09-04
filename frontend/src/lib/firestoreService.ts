import {
  db,
  isRealFirebaseConfigured
} from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch
} from "firebase/firestore";

export interface SourceItem {
  file: string;
  score: string;
  snippet?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
  timestamp: string;
  rating?: "like" | "dislike" | null;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt?: string;
  model?: string;
}

// -------------------------------------------------------------
// 1. LOCAL STORAGE CACHING HELPERS
// -------------------------------------------------------------
const CACHE_KEY_PREFIX = "hyyzo_chats_cache_";

export function getCachedConversations(uid: string): ChatSession[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${uid}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read cached conversations:", e);
  }
  return null;
}

export function setCachedConversations(uid: string, chats: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${uid}`, JSON.stringify(chats));
  } catch (e) {
    console.warn("Failed to write cached conversations:", e);
  }
}

// -------------------------------------------------------------
// 2. FIRESTORE CONVERSATION HISTORY SYNC & PERSISTENCE
// -------------------------------------------------------------

/**
 * Fetch all conversations for the authenticated user from Firestore
 * with subcollections for messages. Falls back to local cache seamlessly.
 */
export async function fetchUserConversationsFromFirestore(uid: string): Promise<ChatSession[]> {
  // Try reading local cache immediately
  const cached = getCachedConversations(uid);

  if (!isRealFirebaseConfigured || !db) {
    return cached && cached.length > 0 ? cached : [];
  }

  try {
    const convsRef = collection(db, "users", uid, "conversations");
    const q = query(convsRef, orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return cached && cached.length > 0 ? cached : [];
    }

    const sessions: ChatSession[] = [];

    for (const convDoc of snapshot.docs) {
      const data = convDoc.data();
      const convId = convDoc.id;

      // Fetch messages subcollection
      const messagesRef = collection(db, "users", uid, "conversations", convId, "messages");
      const mq = query(messagesRef, orderBy("createdAt", "asc"));
      const msgSnap = await getDocs(mq);

      const messages: Message[] = [];
      msgSnap.forEach((mDoc) => {
        const mData = mDoc.data();
        messages.push({
          id: mDoc.id,
          role: mData.role,
          content: mData.content,
          sources: mData.sources || [],
          timestamp: mData.timestamp || "Just now",
          rating: mData.rating || null
        });
      });

      sessions.push({
        id: convId,
        title: data.title || "Conversation",
        createdAt: data.createdAtText || "Recently",
        updatedAt: data.updatedAtText || "Recently",
        model: data.model || "gemini-2.0-flash",
        messages: messages
      });
    }

    // Save fetched sessions into local cache
    setCachedConversations(uid, sessions);
    return sessions;
  } catch (error) {
    console.error("Error fetching conversations from Firestore:", error);
    // Return cached on network error
    return cached && cached.length > 0 ? cached : [];
  }
}

/**
 * Persist conversation metadata and latest messages to Firestore
 */
export async function syncConversationToFirestore(uid: string, chat: ChatSession): Promise<void> {
  // Update local cache first
  const currentCached = getCachedConversations(uid) || [];
  const existingIdx = currentCached.findIndex((c) => c.id === chat.id);
  let updatedList: ChatSession[];
  if (existingIdx >= 0) {
    updatedList = [...currentCached];
    updatedList[existingIdx] = chat;
  } else {
    updatedList = [chat, ...currentCached];
  }
  setCachedConversations(uid, updatedList);

  if (!isRealFirebaseConfigured || !db) return;

  try {
    const convDocRef = doc(db, "users", uid, "conversations", chat.id);
    await setDoc(
      convDocRef,
      {
        id: chat.id,
        title: chat.title,
        createdAtText: chat.createdAt,
        updatedAt: serverTimestamp(),
        updatedAtText: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: chat.model || "gemini-2.0-flash"
      },
      { merge: true }
    );

    // Save all messages in subcollection
    const batch = writeBatch(db);
    for (const msg of chat.messages) {
      const msgRef = doc(db, "users", uid, "conversations", chat.id, "messages", msg.id);
      batch.set(
        msgRef,
        {
          id: msg.id,
          role: msg.role,
          content: msg.content,
          sources: msg.sources || [],
          timestamp: msg.timestamp,
          rating: msg.rating || null,
          createdAt: serverTimestamp()
        },
        { merge: true }
      );
    }
    await batch.commit();
  } catch (error) {
    console.error("Error saving conversation to Firestore:", error);
  }
}

/**
 * Delete conversation from Firestore and local cache
 */
export async function deleteConversationFromFirestore(uid: string, conversationId: string): Promise<void> {
  // Remove from cache
  const cached = getCachedConversations(uid) || [];
  const filtered = cached.filter((c) => c.id !== conversationId);
  setCachedConversations(uid, filtered);

  if (!isRealFirebaseConfigured || !db) return;

  try {
    // Delete messages subcollection
    const messagesRef = collection(db, "users", uid, "conversations", conversationId, "messages");
    const msgSnap = await getDocs(messagesRef);
    const batch = writeBatch(db);
    msgSnap.forEach((mDoc) => {
      batch.delete(mDoc.ref);
    });

    // Delete conversation document
    const convDocRef = doc(db, "users", uid, "conversations", conversationId);
    batch.delete(convDocRef);

    await batch.commit();
  } catch (error) {
    console.error("Error deleting conversation from Firestore:", error);
  }
}

// -------------------------------------------------------------
// 3. GLOBAL LIKE / DISLIKE FEEDBACK MANAGEMENT
// -------------------------------------------------------------

export interface FeedbackPayload {
  userId: string;
  userEmail: string | null;
  conversationId: string;
  messageId: string;
  question?: string;
  response: string;
  rating: "like" | "dislike";
  sources?: SourceItem[];
  model?: string;
}

/**
 * Record message rating in user's subcollection AND in global_feedback collection
 */
export async function recordGlobalFeedback(payload: FeedbackPayload): Promise<void> {
  const { userId, userEmail, conversationId, messageId, question, response, rating, sources, model } = payload;

  // Update local cache
  const cached = getCachedConversations(userId) || [];
  const conv = cached.find((c) => c.id === conversationId);
  if (conv) {
    const msg = conv.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.rating = rating;
      setCachedConversations(userId, cached);
    }
  }

  if (!isRealFirebaseConfigured || !db) {
    return;
  }

  try {
    // 1. Update rating on the user's specific message doc
    const msgDocRef = doc(db, "users", userId, "conversations", conversationId, "messages", messageId);
    await setDoc(msgDocRef, { rating: rating }, { merge: true });

    // 2. Write to the global_feedback collection for team analytics & monitoring
    const globalFeedbackDocRef = doc(db, "global_feedback", `${conversationId}_${messageId}`);
    await setDoc(
      globalFeedbackDocRef,
      {
        userId: userId,
        userEmail: userEmail || "anonymous",
        conversationId: conversationId,
        messageId: messageId,
        question: question || "",
        responseSnippet: response.substring(0, 500),
        rating: rating,
        sourcesCount: sources ? sources.length : 0,
        sources: sources ? sources.map((s) => s.file) : [],
        model: model || "gemini-2.0-flash",
        updatedAt: serverTimestamp(),
        timestamp: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error recording global feedback in Firestore:", error);
  }
}

// -------------------------------------------------------------
// 4. 1-HOUR AUTO-LOGOUT SESSION MANAGEMENT
// -------------------------------------------------------------

export const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 Hour in milliseconds
const SESSION_START_KEY = "hyyzo_session_start_time";
const SESSION_LAST_ACTIVE_KEY = "hyyzo_session_last_active";

export function initializeSession(
  uid: string,
  details?: {
    phoneNumber?: string | null;
    email?: string | null;
    displayName?: string | null;
  }
): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  localStorage.setItem(SESSION_START_KEY, now.toString());
  localStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());

  // Record login event and increment login count in Firestore
  if (isRealFirebaseConfigured && db) {
    const userDocRef = doc(db, "users", uid);
    setDoc(
      userDocRef,
      {
        uid: uid,
        lastLoginAt: serverTimestamp(),
        lastSessionStarted: now,
        loginCount: increment(1),
        ...(details?.email ? { email: details.email } : {}),
        ...(details?.phoneNumber ? { phoneNumber: details.phoneNumber } : {}),
        ...(details?.displayName ? { displayName: details.displayName } : {})
      },
      { merge: true }
    ).catch((err) => console.warn("Could not update user login in Firestore:", err));

    // If phone number is available, also update registered_users collection
    if (details?.phoneNumber) {
      const cleanPhone = cleanPhoneNumber(details.phoneNumber);
      const regDocRef = doc(db, "registered_users", cleanPhone);
      setDoc(
        regDocRef,
        {
          lastLoginAt: serverTimestamp(),
          loginCount: increment(1),
          lastUid: uid
        },
        { merge: true }
      ).catch(() => {});
    }
  }
}

export function refreshLastActivity(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_LAST_ACTIVE_KEY, Date.now().toString());
}

export function isSessionExpired(): boolean {
  if (typeof window === "undefined") return false;
  const rawStart = localStorage.getItem(SESSION_START_KEY);
  if (!rawStart) return false;

  const startTime = parseInt(rawStart, 10);
  if (isNaN(startTime)) return false;

  const now = Date.now();
  return now - startTime >= SESSION_DURATION_MS;
}

export function getRemainingSessionTimeMinutes(): number {
  if (typeof window === "undefined") return 60;
  const rawStart = localStorage.getItem(SESSION_START_KEY);
  if (!rawStart) return 60;

  const startTime = parseInt(rawStart, 10);
  if (isNaN(startTime)) return 60;

  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, SESSION_DURATION_MS - elapsed);
  return Math.ceil(remaining / (60 * 1000));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_START_KEY);
  localStorage.removeItem(SESSION_LAST_ACTIVE_KEY);
}

// -------------------------------------------------------------
// 5. LIVE CONVERSATION & FEEDBACK ANALYTICS CALCULATOR
// -------------------------------------------------------------

export interface SystemAnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  totalUserQueries: number;
  totalAssistantResponses: number;
  totalLikes: number;
  totalDislikes: number;
  satisfactionRate: number; // percentage (0-100)
  totalSourcesCited: number;
  topSources: { file: string; count: number }[];
  sessionMinutesRemaining: number;
}

export function computeAnalytics(chats: ChatSession[]): SystemAnalyticsSummary {
  let totalMessages = 0;
  let totalUserQueries = 0;
  let totalAssistantResponses = 0;
  let totalLikes = 0;
  let totalDislikes = 0;
  let totalSourcesCited = 0;
  const sourceFreqMap: Record<string, number> = {};

  for (const session of chats) {
    for (const msg of session.messages) {
      totalMessages++;
      if (msg.role === "user") {
        totalUserQueries++;
      } else if (msg.role === "assistant") {
        totalAssistantResponses++;
        if (msg.rating === "like") totalLikes++;
        if (msg.rating === "dislike") totalDislikes++;
        if (msg.sources && msg.sources.length > 0) {
          totalSourcesCited += msg.sources.length;
          for (const src of msg.sources) {
            sourceFreqMap[src.file] = (sourceFreqMap[src.file] || 0) + 1;
          }
        }
      }
    }
  }

  const ratedTotal = totalLikes + totalDislikes;
  const satisfactionRate = ratedTotal > 0 ? Math.round((totalLikes / ratedTotal) * 100) : 100;

  const topSources = Object.entries(sourceFreqMap)
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalConversations: chats.length,
    totalMessages,
    totalUserQueries,
    totalAssistantResponses,
    totalLikes,
    totalDislikes,
    satisfactionRate,
    totalSourcesCited,
    topSources,
    sessionMinutesRemaining: getRemainingSessionTimeMinutes()
  };
}

// -------------------------------------------------------------
// 6. PHONE NUMBER AUTHORIZATION & 24-HOUR OTP RATE LIMITING
// -------------------------------------------------------------

export interface OtpVerificationCheck {
  allowed: boolean;
  errorType?: "NOT_REGISTERED" | "RATE_LIMIT_EXCEEDED" | "FIRESTORE_ERROR";
  message?: string;
  attemptsCount?: number;
  attemptsRemaining?: number;
  userData?: {
    name?: string;
    role?: string;
    phoneNumber?: string;
    status?: string;
  };
}

/**
 * Standardize phone number format for consistent Firestore lookups
 */
export function cleanPhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^\d+]/g, "").trim();
  if (!cleaned.startsWith("+")) {
    if (cleaned.length === 10) {
      cleaned = "+91" + cleaned;
    } else {
      cleaned = "+" + cleaned;
    }
  }
  return cleaned;
}

/**
 * Check if the mobile number is pre-registered by admin in Firestore
 * and enforce a strict 2-OTP max limit per 24 hours.
 */
export async function verifyMobileRegistrationAndRateLimit(
  rawPhone: string
): Promise<OtpVerificationCheck> {
  const fullPhone = cleanPhoneNumber(rawPhone);
  const tenDigitPhone = fullPhone.replace(/^\+91/, "");
  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  if (!isRealFirebaseConfigured || !db) {
    // Demo mode: allow testing with a default rate limit in localStorage
    const demoKey = `hyyzo_demo_otp_${fullPhone}`;
    const rawAttempts = localStorage.getItem(demoKey);
    let attempts: number[] = rawAttempts ? JSON.parse(rawAttempts) : [];
    attempts = attempts.filter((t) => now - t < TWENTY_FOUR_HOURS_MS);

    if (attempts.length >= 2) {
      const waitMs = attempts[0] + TWENTY_FOUR_HOURS_MS - now;
      const hours = Math.floor(waitMs / (3600 * 1000));
      const mins = Math.ceil((waitMs % (3600 * 1000)) / (60 * 1000));
      return {
        allowed: false,
        errorType: "RATE_LIMIT_EXCEEDED",
        message: `OTP limit reached (maximum 2 OTPs allowed per 24 hours). Please try again after ${hours}h ${mins}m.`,
        attemptsCount: attempts.length,
        attemptsRemaining: 0
      };
    }

    return {
      allowed: true,
      attemptsCount: attempts.length,
      attemptsRemaining: 2 - attempts.length,
      userData: { name: "Demo User", role: "member", phoneNumber: fullPhone, status: "active" }
    };
  }

  try {
    // 1. Check if phone is registered in 'registered_users' collection (try both +91... and 10-digit doc IDs)
    let userDocRef = doc(db, "registered_users", fullPhone);
    let userSnapshot = await getDoc(userDocRef);

    if (!userSnapshot.exists()) {
      // Also try 10 digit document ID format if admin entered without country code
      userDocRef = doc(db, "registered_users", tenDigitPhone);
      userSnapshot = await getDoc(userDocRef);
    }

    // If still not found in registered_users, check 'authorized_phones'
    if (!userSnapshot.exists()) {
      const altDocRef = doc(db, "authorized_phones", fullPhone);
      const altSnapshot = await getDoc(altDocRef);
      if (altSnapshot.exists()) {
        userSnapshot = altSnapshot;
      }
    }

    // If the mobile number does not exist or is inactive, BLOCK OTP
    if (!userSnapshot.exists()) {
      return {
        allowed: false,
        errorType: "NOT_REGISTERED",
        message: "Mobile number is not registered. First need to register via admin to get access."
      };
    }

    const userData = userSnapshot.data();
    if (userData?.status && userData.status === "inactive") {
      return {
        allowed: false,
        errorType: "NOT_REGISTERED",
        message: "Your account is marked inactive. Please contact the administrator for access."
      };
    }

    // 2. Check 24-Hour OTP Rate Limit
    // Fetch attempts from 'otp_attempts' collection
    const attemptsDocRef = doc(db, "otp_attempts", fullPhone);
    const attemptsSnapshot = await getDoc(attemptsDocRef);
    let attemptsHistory: number[] = [];

    if (attemptsSnapshot.exists()) {
      const data = attemptsSnapshot.data();
      if (Array.isArray(data.attempts)) {
        attemptsHistory = data.attempts;
      }
    } else if (Array.isArray(userData?.otpAttempts)) {
      attemptsHistory = userData.otpAttempts;
    }

    // Filter to only retain attempts within the last 24 hours
    const recentAttempts = attemptsHistory.filter((timestamp) => now - timestamp < TWENTY_FOUR_HOURS_MS);

    if (recentAttempts.length >= 2) {
      const oldestAttempt = recentAttempts[0];
      const waitMs = oldestAttempt + TWENTY_FOUR_HOURS_MS - now;
      const hours = Math.floor(waitMs / (3600 * 1000));
      const mins = Math.ceil((waitMs % (3600 * 1000)) / (60 * 1000));

      return {
        allowed: false,
        errorType: "RATE_LIMIT_EXCEEDED",
        message: `OTP limit reached (maximum 2 OTPs allowed per 24 hours). Please try again after ${hours > 0 ? `${hours}h ` : ""}${mins}m.`,
        attemptsCount: recentAttempts.length,
        attemptsRemaining: 0,
        userData: {
          name: userData?.name || "Hyyzo User",
          role: userData?.role || "member",
          phoneNumber: fullPhone,
          status: userData?.status || "active"
        }
      };
    }

    return {
      allowed: true,
      attemptsCount: recentAttempts.length,
      attemptsRemaining: 2 - recentAttempts.length,
      userData: {
        name: userData?.name || "Hyyzo User",
        role: userData?.role || "member",
        phoneNumber: fullPhone,
        status: userData?.status || "active"
      }
    };
  } catch (error: any) {
    console.error("Firestore verification error:", error);
    return {
      allowed: false,
      errorType: "FIRESTORE_ERROR",
      message: error.message || "Failed to verify mobile registration with Firestore."
    };
  }
}

/**
 * Record an OTP send attempt in Firestore (both in registered_users and otp_attempts collections)
 */
export async function recordOtpAttemptToFirestore(rawPhone: string): Promise<void> {
  const fullPhone = cleanPhoneNumber(rawPhone);
  const now = Date.now();
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

  if (!isRealFirebaseConfigured || !db) {
    const demoKey = `hyyzo_demo_otp_${fullPhone}`;
    const rawAttempts = localStorage.getItem(demoKey);
    let attempts: number[] = rawAttempts ? JSON.parse(rawAttempts) : [];
    attempts = attempts.filter((t) => now - t < TWENTY_FOUR_HOURS_MS);
    attempts.push(now);
    localStorage.setItem(demoKey, JSON.stringify(attempts));
    return;
  }

  try {
    // 1. Update otp_attempts collection
    const attemptsDocRef = doc(db, "otp_attempts", fullPhone);
    const snap = await getDoc(attemptsDocRef);
    let existingAttempts: number[] = [];

    if (snap.exists() && Array.isArray(snap.data()?.attempts)) {
      existingAttempts = snap.data().attempts.filter((t: number) => now - t < TWENTY_FOUR_HOURS_MS);
    }
    existingAttempts.push(now);

    await setDoc(
      attemptsDocRef,
      {
        phoneNumber: fullPhone,
        attempts: existingAttempts,
        lastAttemptAt: serverTimestamp(),
        count24h: existingAttempts.length,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    // 2. Also update registered_users document
    const userDocRef = doc(db, "registered_users", fullPhone);
    await setDoc(
      userDocRef,
      {
        lastOtpSentAt: serverTimestamp(),
        otpAttempts: existingAttempts
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not record OTP attempt to Firestore:", err);
  }
}

/**
 * Helper to register or seed an authorized user into Firestore
 */
export async function registerAuthorizedUserInFirestore(
  rawPhone: string,
  name: string = "Admin / Team Member",
  role: "admin" | "member" = "member"
): Promise<{ success: boolean; message: string }> {
  const fullPhone = cleanPhoneNumber(rawPhone);

  if (!isRealFirebaseConfigured || !db) {
    return { success: true, message: `(Demo Mode) User registered for ${fullPhone}` };
  }

  try {
    const userDocRef = doc(db, "registered_users", fullPhone);
    await setDoc(
      userDocRef,
      {
        phoneNumber: fullPhone,
        name: name,
        role: role,
        status: "active",
        createdAt: serverTimestamp(),
        otpAttempts: [],
        registeredBy: "admin"
      },
      { merge: true }
    );
    return { success: true, message: `Successfully registered ${fullPhone} in Firestore!` };
  } catch (err: any) {
    console.error("Error registering user in Firestore:", err);
    return { success: false, message: err.message || "Failed to register user in Firestore." };
  }
}
