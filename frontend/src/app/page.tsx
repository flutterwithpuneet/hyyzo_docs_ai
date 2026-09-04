"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Plus,
  Trash2,
  Send,
  RefreshCw,
  FileText,
  MessageSquare,
  Bot,
  User,
  Folder,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  ArrowUp,
  Settings,
  Search,
  Mic,
  RotateCcw,
  Command,
  HelpCircle,
  X,
  Sliders,
  Database,
  Cpu,
  Layers,
  Code2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Clock
} from "lucide-react";
import VercelLogin, { AuthUser } from "@/components/VercelLogin";
import { auth, fbSignOut, onAuthStateChanged, trackAnalyticsEvent } from "@/lib/firebase";
import {
  fetchUserConversationsFromFirestore,
  syncConversationToFirestore,
  deleteConversationFromFirestore,
  recordGlobalFeedback,
  initializeSession,
  isSessionExpired,
  clearSession,
  getRemainingSessionTimeMinutes,
  refreshLastActivity,
  ChatSession,
  Message,
  SourceItem
} from "@/lib/firestoreService";

interface DocFile {
  name: string;
  path: string;
  size_bytes: number;
}

const INITIAL_DEFAULT_CHAT: ChatSession = {
  id: "session-default",
  title: "New Session",
  messages: [],
  createdAt: "Just now"
};

export default function WorldClassAIAssistant() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [chats, setChats] = useState<ChatSession[]>([INITIAL_DEFAULT_CHAT]);
  const [currentChatId, setCurrentChatId] = useState<string>("session-default");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelSelected, setModelSelected] = useState("gemini-flash-latest");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<DocFile[]>([]);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>({});
  const [searchFilter, setSearchFilter] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSignOut = async (customMessage?: string) => {
    if (auth) {
      try {
        await fbSignOut(auth);
      } catch (e) {
        console.error("Sign out error:", e);
      }
    }
    clearSession();
    localStorage.removeItem("hyyzo_auth_user");
    setCurrentUser(null);
    showToast(customMessage || "Signed out successfully");
  };

  // Load auth state and Firebase listener with 1-hour session enforcement
  useEffect(() => {
    const savedUser = localStorage.getItem("hyyzo_auth_user");
    if (savedUser) {
      try {
        if (isSessionExpired()) {
          handleSignOut("Your session expired after 1 hour. Please sign in again.");
        } else {
          setCurrentUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error("Local auth parsing error:", e);
      }
    }

    let unsubscribe = () => {};
    if (auth) {
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          if (isSessionExpired()) {
            handleSignOut("Your session expired after 1 hour. Please sign in again.");
          } else {
            const authUser: AuthUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Hyyzo User",
              photoURL: fbUser.photoURL
            };
            setCurrentUser(authUser);
            localStorage.setItem("hyyzo_auth_user", JSON.stringify(authUser));
          }
        }
        setAuthInitialized(true);
      });
    } else {
      setAuthInitialized(true);
    }

    return () => unsubscribe();
  }, []);

  // Fetch Firestore conversation history when authenticated user is present
  useEffect(() => {
    if (currentUser?.uid) {
      fetchUserConversationsFromFirestore(currentUser.uid).then((loadedSessions) => {
        if (loadedSessions && loadedSessions.length > 0) {
          setChats(loadedSessions);
          setCurrentChatId(loadedSessions[0].id);
        }
      });
    }
  }, [currentUser?.uid]);

  // Periodic 1-Hour Auto-Logout Watcher & User Activity Refresh
  useEffect(() => {
    if (!currentUser) return;

    // Check expiration every 15 seconds
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        handleSignOut("Session expired after 1 hour limit. Please sign in again.");
      }
    }, 15000);

    const onUserActivity = () => {
      refreshLastActivity();
    };

    window.addEventListener("mousemove", onUserActivity, { passive: true });
    window.addEventListener("keydown", onUserActivity, { passive: true });
    window.addEventListener("click", onUserActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", onUserActivity);
      window.removeEventListener("keydown", onUserActivity);
      window.removeEventListener("click", onUserActivity);
    };
  }, [currentUser]);

  // Sync theme with localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("hyyzo-theme") as "dark" | "light" | null;
    if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.documentElement.classList.remove("light");
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
      }
    }
  }, []);

  const handleSetTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("hyyzo-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };

  // Initial server connection checks
  useEffect(() => {
    checkHealth();
    fetchDocsList();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId, isLoading]);

  // Keyboard shortcut listener (Ctrl+K or Cmd+K for new chat, Esc for modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleNewChat();
      } else if (e.key === "Escape") {
        setShowDocsModal(false);
        setShowSettingsModal(false);
        setShowShortcutsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const checkHealth = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/health");
      if (res.ok) {
        const data = await res.json();
        setServerHealthy(data.engine_ready);
      } else {
        setServerHealthy(false);
      }
    } catch {
      setServerHealthy(false);
    }
  };

  const fetchDocsList = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/docs-list");
      if (res.ok) {
        const data = await res.json();
        setDocFiles(data.files || []);
      }
    } catch (e) {
      console.error("Docs list fetch error:", e);
    }
  };

  const handleModelSelect = async (newModel: string) => {
    setModelSelected(newModel);
    try {
      const res = await fetch("/api/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: newModel })
      });
      if (res.ok) {
        showToast(`Switched active AI model to ${newModel}`);
      }
    } catch (e) {
      console.error("Model select error:", e);
    }
  };

  const currentChat = chats.find((c) => c.id === currentChatId) || chats[0];

  const handleNewChat = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: "New Session",
      messages: [],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: modelSelected
    };
    setChats((prev) => [newSession, ...prev]);
    setCurrentChatId(newId);
    if (currentUser?.uid) {
      syncConversationToFirestore(currentUser.uid, newSession);
    }
    showToast("Created new conversation session");
  };

  const handleDeleteChat = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chats.length <= 1) return;
    const filtered = chats.filter((c) => c.id !== idToDelete);
    setChats(filtered);
    if (currentChatId === idToDelete) {
      setCurrentChatId(filtered[0].id);
    }
    if (currentUser?.uid) {
      deleteConversationFromFirestore(currentUser.uid, idToDelete);
    }
    showToast("Conversation deleted from Firestore");
  };

  const handleRateMessage = async (msgId: string, rating: "like" | "dislike") => {
    if (!currentChat) return;
    const msg = currentChat.messages.find((m) => m.id === msgId);
    if (!msg) return;

    // Find previous user prompt
    const msgIdx = currentChat.messages.findIndex((m) => m.id === msgId);
    const prevMsg = msgIdx > 0 ? currentChat.messages[msgIdx - 1] : null;
    const questionText = prevMsg?.role === "user" ? prevMsg.content : "";

    // Toggle if same clicked
    const newRating = msg.rating === rating ? null : rating;

    // Optimistic UI update
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === currentChat.id) {
          const updatedMessages = c.messages.map((m) => (m.id === msgId ? { ...m, rating: newRating } : m));
          const updatedChat = { ...c, messages: updatedMessages };
          if (currentUser?.uid) {
            syncConversationToFirestore(currentUser.uid, updatedChat);
          }
          return updatedChat;
        }
        return c;
      })
    );

    if (newRating && currentUser) {
      await recordGlobalFeedback({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        conversationId: currentChat.id,
        messageId: msg.id,
        question: questionText,
        response: msg.content,
        rating: newRating,
        sources: msg.sources,
        model: modelSelected
      });
      showToast(newRating === "like" ? "Marked as helpful 👍 — Saved to Firestore" : "Feedback recorded 👎 — Saved to Firestore");
    } else {
      showToast("Feedback cleared");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let activeSessionToSync: ChatSession | null = null;

    setChats((prev) =>
      prev.map((session) => {
        if (session.id === currentChatId) {
          const updatedMessages = [...session.messages, userMsg];
          const newTitle =
            session.messages.length === 0
              ? queryText.length > 28
                ? queryText.substring(0, 28) + "..."
                : queryText
              : session.title;
          const updated = { ...session, title: newTitle, messages: updatedMessages, model: modelSelected };
          activeSessionToSync = updated;
          return updated;
        }
        return session;
      })
    );

    if (activeSessionToSync && currentUser?.uid) {
      syncConversationToFirestore(currentUser.uid, activeSessionToSync);
    }

    setInput("");
    setAttachedFile(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Query failed");
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rating: null
      };

      setChats((prev) =>
        prev.map((session) => {
          if (session.id === currentChatId) {
            const updated = { ...session, messages: [...session.messages, assistantMsg], model: modelSelected };
            if (currentUser?.uid) {
              syncConversationToFirestore(currentUser.uid, updated);
            }
            return updated;
          }
          return session;
        })
      );
    } catch (err: any) {
      const errorMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: `⚠️ **Service Error**: ${err.message || "Failed to communicate with RAG Server."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChats((prev) =>
        prev.map((session) => {
          if (session.id === currentChatId) {
            const updated = { ...session, messages: [...session.messages, errorMsg] };
            if (currentUser?.uid) {
              syncConversationToFirestore(currentUser.uid, updated);
            }
            return updated;
          }
          return session;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (!currentChat || currentChat.messages.length === 0) return;
    const lastUserMsg = [...currentChat.messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const res = await fetch("http://localhost:8000/api/reindex", { method: "POST" });
      if (res.ok) {
        showToast("Documentation re-indexed successfully!");
      } else {
        showToast("Re-indexing failed.");
      }
    } catch {
      showToast("Could not reach Python backend for re-indexing.");
    } finally {
      setIsReindexing(false);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const promptSuggestions = [
    {
      title: "Explain Rewards Architecture",
      desc: "Clean architecture & layers breakdown of lib/features/rewards/",
      icon: Layers
    },
    {
      title: "Search API Documentation",
      desc: "Retrieve REST endpoints and data response schemas",
      icon: Code2
    },
    {
      title: "Summarize Data Pipeline",
      desc: "Understand repository pattern & state management flow",
      icon: Database
    },
    {
      title: "List Project Documents",
      desc: "View loaded Markdown files & index size details",
      icon: Cpu
    }
  ];

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  if (!currentUser && authInitialized) {
    return (
      <VercelLogin
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          showToast(`Welcome back, ${u.displayName || "User"}`);
        }}
        theme={theme}
      />
    );
  }

  const userInitials = currentUser?.displayName
    ? currentUser.displayName.substring(0, 2).toUpperCase()
    : currentUser?.email
    ? currentUser.email.substring(0, 2).toUpperCase()
    : currentUser?.phoneNumber
    ? currentUser.phoneNumber.slice(-2)
    : "HY";

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0F1117] text-[#F3F4F6]' : 'bg-[#FFFFFF] text-[#111827]'}`}>
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg bg-[#2563EB] text-white border-blue-400/40 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION */}
      {/* --------------------------------------------------------- */}
      <aside
        className={`${
          sidebarOpen ? "w-72" : "w-0 -translate-x-full"
        } transition-all duration-300 ease-in-out flex flex-col h-full border-r shrink-0 z-20 relative overflow-hidden ${
          theme === 'dark'
            ? 'bg-[#181A20] border-[#2A2D35]'
            : 'bg-[#F8F9FB] border-[#E5E7EB]'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/icon.png"
              alt="Hyyzo Logo"
              className="w-7 h-7 rounded-full object-contain shadow-sm shrink-0"
            />
            <div>
              <span className="font-bold text-sm tracking-tight block">Hyyzo AI</span>
              <span className={`text-[10px] block font-mono ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Docs Assistant</span>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className={`p-1.5 rounded-lg transition ${
              theme === 'dark'
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60'
            }`}
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* User Profile Card with Sign Out */}
        {currentUser && (
          <div className="px-3 py-2">
            <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
              theme === 'dark' ? 'bg-[#14161E] border-[#2A2D35]' : 'bg-white border-[#E5E7EB] shadow-xs'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate leading-tight">
                    {currentUser.displayName || "Hyyzo Member"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] truncate ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {currentUser.email || currentUser.phoneNumber || "Authenticated"}
                    </span>
                    <span className={`text-[9px] px-1 py-0.2 rounded font-mono inline-flex items-center gap-0.5 ${
                      theme === 'dark' ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'
                    }`} title="Active 1-hour secure session">
                      <Clock className="w-2.5 h-2.5" />
                      1h max
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSignOut()}
                className={`p-1.5 rounded-lg transition shrink-0 ${
                  theme === 'dark' ? 'text-zinc-400 hover:text-rose-400 hover:bg-[#22252E]' : 'text-zinc-500 hover:text-rose-600 hover:bg-zinc-100'
                }`}
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* New Session Button */}
        <div className="px-3 pb-2">
          <button
            onClick={handleNewChat}
            className={`w-full py-2.5 px-3.5 rounded-xl font-semibold text-xs flex items-center justify-between transition active:scale-[0.98] shadow-sm ${
              theme === 'dark'
                ? 'bg-[#4F8CFF] hover:bg-blue-500 text-white'
                : 'bg-[#2563EB] hover:bg-blue-700 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </div>
            <span className="text-[10px] opacity-70 font-mono">Ctrl+K</span>
          </button>
        </div>

        {/* Search Input Filter */}
        <div className="px-3 py-1.5">
          <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
            theme === 'dark' ? 'bg-[#0F1117] border-[#2A2D35] text-zinc-300' : 'bg-white border-[#E5E7EB] text-zinc-700'
          }`}>
            <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs placeholder:text-zinc-400"
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          <div className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            Conversations
          </div>

          {filteredChats.map((session) => {
            const isActive = session.id === currentChatId;
            return (
              <div
                key={session.id}
                onClick={() => setCurrentChatId(session.id)}
                className={`group px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer transition text-xs font-medium ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-[#22252E] text-white font-semibold shadow-xs'
                      : 'bg-white text-zinc-900 font-semibold shadow-xs border border-zinc-200/80'
                    : theme === 'dark'
                      ? 'text-zinc-400 hover:bg-[#22252E]/60 hover:text-zinc-200'
                      : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-500' : 'opacity-50'}`} />
                  <span className="truncate">{session.title}</span>
                </div>
                {chats.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteChat(session.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-1 transition ${
                      theme === 'dark' ? 'text-zinc-500 hover:text-rose-400' : 'text-zinc-400 hover:text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer Controls */}
        <div className={`p-3 border-t space-y-1.5 ${
          theme === 'dark' ? 'border-[#2A2D35]' : 'border-[#E5E7EB]'
        }`}>
          <button
            onClick={handleReindex}
            disabled={isReindexing}
            className={`w-full py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
              theme === 'dark'
                ? 'border-[#2A2D35] bg-[#0F1117]/60 hover:bg-[#22252E] text-zinc-300'
                : 'border-[#E5E7EB] bg-white hover:bg-zinc-100 text-zinc-700 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin text-blue-500' : ''}`} />
              <span>Re-index Vector Store</span>
            </div>
          </button>

          <button
            onClick={() => setShowDocsModal(true)}
            className={`w-full py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
              theme === 'dark'
                ? 'border-[#2A2D35] bg-[#0F1117]/60 hover:bg-[#22252E] text-zinc-300'
                : 'border-[#E5E7EB] bg-white hover:bg-zinc-100 text-zinc-700 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
              <span>Document Files</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              theme === 'dark' ? 'bg-[#22252E] text-zinc-300' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {docFiles.length}
            </span>
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className={`w-full py-2 px-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
              theme === 'dark'
                ? 'border-[#2A2D35] bg-[#0F1117]/60 hover:bg-[#22252E] text-zinc-300'
                : 'border-[#E5E7EB] bg-white hover:bg-zinc-100 text-zinc-700 shadow-xs'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Preferences & Config</span>
          </button>
        </div>

      </aside>

      {/* --------------------------------------------------------- */}
      {/* MAIN CANVAS AREA */}
      {/* --------------------------------------------------------- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="gemini-ambient-glow" />
        
        {/* Sticky Top Header Navigation */}
        <header className={`h-14 border-b flex items-center justify-between px-4 z-10 glass-header ${
          theme === 'dark' ? 'border-[#2A2D35]' : 'border-[#E5E7EB]'
        }`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    theme === 'dark'
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                  title="Expand Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                <img
                  src="/logo.png"
                  alt="Hyyzo Logo"
                  className="w-6 h-6 rounded-full shadow-sm"
                />
              </div>
            )}

            {/* Model Selector Selector Dropdown Pill */}
            <div className={`relative flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${
              theme === 'dark'
                ? 'bg-[#181A20] border-[#2A2D35] text-zinc-200'
                : 'bg-[#F8F9FB] border-[#E5E7EB] text-zinc-800'
            }`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-dot shrink-0" />
              <select
                value={modelSelected}
                onChange={(e) => handleModelSelect(e.target.value)}
                className="bg-transparent border-none outline-none font-medium cursor-pointer appearance-none pr-5 text-xs"
              >
                <option value="gemini-flash-latest" className={theme === 'dark' ? 'bg-[#181A20] text-white' : 'bg-white text-zinc-900'}>
                  Google Gemini Flash (Recommended)
                </option>
                <option value="gemini-2.0-flash" className={theme === 'dark' ? 'bg-[#181A20] text-white' : 'bg-white text-zinc-900'}>
                  Google Gemini 2.0 Flash
                </option>
                <option value="gemini-2.0-flash-lite" className={theme === 'dark' ? 'bg-[#181A20] text-white' : 'bg-white text-zinc-900'}>
                  Google Gemini 2.0 Flash Lite
                </option>
              </select>
              <ChevronDown className={`w-3.5 h-3.5 pointer-events-none absolute right-2.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Server Health Status Dot */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              serverHealthy
                ? theme === 'dark' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : theme === 'dark' ? 'bg-rose-950/40 text-rose-400 border-rose-800/40' : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${serverHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{serverHealthy ? "Engine Ready" : "Disconnected"}</span>
            </div>

            {/* Shortcuts Guide Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className={`p-1.5 rounded-lg transition ${
                theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title="Keyboard Shortcuts"
            >
              <Command className="w-4 h-4" />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => handleSetTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-1.5 rounded-lg transition ${
                theme === 'dark'
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </header>

        {/* Conversation Canvas */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0 py-6 max-w-3xl mx-auto w-full space-y-6">
          
          {/* Empty State Welcome Layout */}
          {(!currentChat || currentChat.messages.length === 0) && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-300">
              <div className="space-y-2 max-w-md">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  What can I help you explore?
                </h1>
                <p className={`text-xs md:text-sm leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Ask questions about project documentation, architecture design, REST APIs, or data flows.
                </p>
              </div>

              {/* Prompt Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
                {promptSuggestions.map((prompt, idx) => {
                  const IconComp = prompt.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt.title)}
                      className={`p-4 rounded-2xl border text-left transition duration-200 group flex flex-col justify-between ${
                        theme === 'dark'
                          ? 'bg-[#181A20] border-[#2A2D35] hover:border-blue-500/60 hover:bg-[#22252E]'
                          : 'bg-white border-[#E5E7EB] hover:border-blue-500/60 hover:bg-zinc-50 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <IconComp className="w-4 h-4 text-blue-500" />
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-xs mb-0.5">{prompt.title}</div>
                        <div className={`text-[11px] line-clamp-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {prompt.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Render Active Messages */}
          {currentChat &&
            currentChat.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 group animate-in fade-in duration-200 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* AI Avatar */}
                {msg.role === "assistant" && (
                  <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    theme === 'dark' ? 'bg-[#181A20] border-[#2A2D35] text-blue-400' : 'bg-white border-[#E5E7EB] text-blue-600'
                  }`}>
                    <Bot className="w-4 h-4 text-blue-500" />
                  </div>
                )}

                <div className={`flex-1 space-y-2 min-w-0 max-w-2xl ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {msg.role === "assistant" ? "Hyyzo AI" : "You"}
                    </span>
                    <span className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{msg.timestamp}</span>
                  </div>

                  {/* Message Content */}
                  {msg.role === "user" ? (
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      theme === 'dark'
                        ? "text-zinc-100 bg-[#181A20] border border-[#2A2D35] px-4 py-3 rounded-2xl shadow-xs"
                        : "text-zinc-900 bg-zinc-100 border border-zinc-200 px-4 py-3 rounded-2xl"
                    }`}>
                      {msg.content}
                    </div>
                  ) : (
                    <div className={`text-sm markdown-body p-4 rounded-2xl border ${
                      theme === 'dark'
                        ? "text-zinc-200 bg-[#181A20]/80 border-[#2A2D35]"
                        : "text-zinc-900 bg-white border-[#E5E7EB] shadow-xs"
                    }`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}

                  {/* Sources Collapsible Drawer */}
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="pt-1 w-full">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className={`text-xs font-medium flex items-center gap-1.5 py-1 px-2.5 rounded-lg border transition ${
                          theme === 'dark'
                            ? 'text-zinc-400 hover:text-zinc-200 border-[#2A2D35] bg-[#181A20]'
                            : 'text-zinc-600 hover:text-zinc-900 border-[#E5E7EB] bg-zinc-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span>Sources Used ({msg.sources.length})</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                            expandedSources[msg.id] ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {expandedSources[msg.id] && (
                        <div className={`mt-2 space-y-2 pl-3 border-l-2 ${theme === 'dark' ? 'border-[#2A2D35]' : 'border-zinc-300'}`}>
                          {msg.sources.map((src, i) => (
                            <div key={i} className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              theme === 'dark'
                                ? 'bg-[#181A20] border-[#2A2D35]'
                                : 'bg-white border-[#E5E7EB] shadow-xs'
                            }`}>
                              <div className="flex items-center justify-between font-medium text-blue-500">
                                <span>📄 {src.file}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  theme === 'dark' ? 'bg-[#22252E] text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                                }`}>
                                  Score: {src.score}
                                </span>
                              </div>
                              {src.snippet && (
                                <p className={`text-[11px] line-clamp-2 italic ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                  "{src.snippet}"
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar for Assistant Responses */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 pt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={handleRegenerate}
                        className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'}`}
                        title="Regenerate Response"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRateMessage(msg.id, "like")}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          msg.rating === "like"
                            ? "text-emerald-400 bg-emerald-500/20 border border-emerald-500/40"
                            : theme === "dark"
                              ? "text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]"
                              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        }`}
                        title="Good Response (Like)"
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${msg.rating === "like" ? "fill-emerald-400/30" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleRateMessage(msg.id, "dislike")}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          msg.rating === "dislike"
                            ? "text-rose-400 bg-rose-500/20 border border-rose-500/40"
                            : theme === "dark"
                              ? "text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]"
                              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                        }`}
                        title="Needs Improvement (Dislike)"
                      >
                        <ThumbsDown className={`w-3.5 h-3.5 ${msg.rating === "dislike" ? "fill-rose-400/30" : ""}`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

          {/* Loading Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3.5 items-center text-xs animate-in fade-in duration-200">
              <div className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 ${
                theme === 'dark' ? 'bg-[#181A20] border-[#2A2D35] text-blue-400' : 'bg-white border-[#E5E7EB] text-blue-600'
              }`}>
                <Bot className="w-4 h-4 text-blue-500 animate-spin" />
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse [animation-delay:200ms]" />
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse [animation-delay:400ms]" />
                <span className="text-xs font-medium ml-1">Searching docs & generating...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* --------------------------------------------------------- */}
        {/* FLOATING COMPOSER INPUT */}
        {/* --------------------------------------------------------- */}
        <div className="p-4 max-w-3xl mx-auto w-full">
          <div className={`p-3.5 gemini-glass-composer transition-all duration-300 ${
            theme === 'dark'
              ? 'border-white/10'
              : 'border-zinc-200/90 bg-white shadow-lg shadow-zinc-200/60'
          }`}>
            
            {/* Attachment Chip if file selected */}
            {attachedFile && (
              <div className={`mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                theme === 'dark'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
              }`}>
                <Paperclip className="w-3 h-3" />
                <span>{attachedFile}</span>
                <X
                  className="w-3 h-3 cursor-pointer hover:opacity-80 ml-1"
                  onClick={() => setAttachedFile(null)}
                />
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask anything about project docs, architecture, or codebase..."
              rows={2}
              className={`w-full bg-transparent border-none outline-none resize-none text-sm font-normal ${
                theme === 'dark'
                  ? 'text-zinc-100 placeholder:text-zinc-500'
                  : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
            />

            <div className={`flex items-center justify-between pt-2.5 border-t ${
              theme === 'dark' ? 'border-zinc-800/80' : 'border-zinc-100'
            }`}>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFile("rewards_architecture.md");
                    showToast("Attached context file");
                  }}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    theme === 'dark'
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                  title="Attach Context File"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsListening(!isListening);
                    showToast(isListening ? "Voice dictation stopped" : "Voice listening active...");
                  }}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    isListening
                      ? 'text-rose-500 bg-rose-500/10 animate-pulse'
                      : theme === 'dark'
                        ? 'text-zinc-400 hover:text-zinc-100 hover:bg-[#22252E]'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                  title="Voice Dictation Input"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono hidden sm:inline ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  Enter to send
                </span>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-xl text-white font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#4F8CFF] hover:bg-blue-500 shadow-md shadow-blue-500/20'
                      : 'bg-[#2563EB] hover:bg-blue-600 shadow-sm shadow-blue-500/30'
                  }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <p className={`text-[11px] text-center mt-2.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
            Hyyzo AI Assistant can make mistakes. Verify important project details.
          </p>
        </div>

      </main>

      {/* --------------------------------------------------------- */}
      {/* DOCUMENT FILES MODAL */}
      {/* --------------------------------------------------------- */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl border p-5 shadow-2xl space-y-4 ${
            theme === 'dark' ? 'bg-[#181A20] border-[#2A2D35] text-white' : 'bg-white border-[#E5E7EB] text-zinc-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Folder className="w-4 h-4 text-blue-500" />
                <span>Indexed Documentation Files ({docFiles.length})</span>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-[#22252E] text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {docFiles.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400">No document files found in `docs/`.</div>
              ) : (
                docFiles.map((file, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    theme === 'dark' ? 'bg-[#0F1117] border-[#2A2D35]' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <div>
                        <div className="font-semibold">{file.name}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{file.path}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono opacity-70">{(file.size_bytes / 1024).toFixed(1)} KB</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* PREFERENCES & CONFIG MODAL */}
      {/* --------------------------------------------------------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl space-y-5 ${
            theme === 'dark' ? 'bg-[#181A20] border-[#2A2D35] text-white' : 'bg-white border-[#E5E7EB] text-zinc-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-zinc-500/20">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Settings className="w-4 h-4 text-blue-500" />
                <span>Preferences & Configuration</span>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-[#22252E] text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1.5">Theme Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSetTheme("dark")}
                    className={`py-2 px-3 rounded-xl border font-medium flex items-center justify-center gap-2 transition ${
                      theme === 'dark' ? 'bg-[#4F8CFF] text-white border-blue-400' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => handleSetTheme("light")}
                    className={`py-2 px-3 rounded-xl border font-medium flex items-center justify-center gap-2 transition ${
                      theme === 'light' ? 'bg-[#2563EB] text-white border-blue-600' : 'bg-[#181A20] text-zinc-300 border-[#2A2D35]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1.5">Active Gemini Model</label>
                <select
                  value={modelSelected}
                  onChange={(e) => handleModelSelect(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    theme === 'dark' ? 'bg-[#0F1117] border-[#2A2D35] text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                  }`}
                >
                  <option value="gemini-flash-latest">Google Gemini Flash (Recommended)</option>
                  <option value="gemini-2.0-flash">Google Gemini 2.0 Flash</option>
                  <option value="gemini-2.0-flash-lite">Google Gemini 2.0 Flash Lite</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1.5">RAG Query Similarity Top K</label>
                <input
                  type="text"
                  disabled
                  value="3 Source Nodes"
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono opacity-70 ${
                    theme === 'dark' ? 'bg-[#0F1117] border-[#2A2D35]' : 'bg-zinc-50 border-zinc-200'
                  }`}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------- */}
      {/* KEYBOARD SHORTCUTS MODAL */}
      {/* --------------------------------------------------------- */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-2xl border p-5 shadow-2xl space-y-4 ${
            theme === 'dark' ? 'bg-[#181A20] border-[#2A2D35] text-white' : 'bg-white border-[#E5E7EB] text-zinc-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-zinc-500/20">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Command className="w-4 h-4 text-blue-500" />
                <span>Keyboard Shortcuts</span>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className={`p-1 rounded-lg ${theme === 'dark' ? 'hover:bg-[#22252E] text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">New Conversation</span>
                <kbd className="px-2 py-1 rounded bg-zinc-500/20 font-mono text-[10px]">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Send Message</span>
                <kbd className="px-2 py-1 rounded bg-zinc-500/20 font-mono text-[10px]">Enter</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Add Line Break</span>
                <kbd className="px-2 py-1 rounded bg-zinc-500/20 font-mono text-[10px]">Shift + Enter</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Close Modals</span>
                <kbd className="px-2 py-1 rounded bg-zinc-500/20 font-mono text-[10px]">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
