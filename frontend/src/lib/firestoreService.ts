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

export function initializeSession(uid: string): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  localStorage.setItem(SESSION_START_KEY, now.toString());
  localStorage.setItem(SESSION_LAST_ACTIVE_KEY, now.toString());

  // Record login event in user profile in Firestore
  if (isRealFirebaseConfigured && db) {
    const userDocRef = doc(db, "users", uid);
    setDoc(
      userDocRef,
      {
        lastLoginAt: serverTimestamp(),
        lastSessionStarted: now
      },
      { merge: true }
    ).catch(() => {});
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
