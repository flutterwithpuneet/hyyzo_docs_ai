"use client";

import React, { useState, useEffect, useRef } from "react";
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
  CheckCircle,
  AlertCircle,
  Folder,
  Layers,
  ChevronRight,
  Sun,
  Moon,
  Search
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000/api";

interface SourceItem {
  file: string;
  score: string;
  snippet?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

interface DocFile {
  name: string;
  path: string;
  size_bytes: number;
}

export default function Home() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState<string | null>(null);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);
  const [docFiles, setDocFiles] = useState<DocFile[]>([]);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [userName, setUserName] = useState("Puneet");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    const defaultChatId = Math.random().toString(36).substring(2, 9);
    const initialSession: ChatSession = {
      id: defaultChatId,
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChats([initialSession]);
    setCurrentChatId(defaultChatId);

    // Check FastAPI Server Health
    checkHealth();
    fetchDocsList();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId, isLoading]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
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
      const res = await fetch(`${API_BASE_URL}/docs-list`);
      if (res.ok) {
        const data = await res.json();
        setDocFiles(data.files || []);
      }
    } catch (e) {
      console.error("Failed to fetch docs list:", e);
    }
  };

  const currentChat = chats.find((c) => c.id === currentChatId) || chats[0];

  const handleNewChat = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: "New Conversation",
      messages: [],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChats((prev) => [newSession, ...prev]);
    setCurrentChatId(newId);
  };

  const handleDeleteChat = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (chats.length <= 1) return;
    const filtered = chats.filter((c) => c.id !== idToDelete);
    setChats(filtered);
    if (currentChatId === idToDelete) {
      setCurrentChatId(filtered[0].id);
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

    // Update session messages & auto-title
    setChats((prev) =>
      prev.map((session) => {
        if (session.id === currentChatId) {
          const updatedMessages = [...session.messages, userMsg];
          const newTitle =
            session.messages.length === 0
              ? queryText.length > 25
                ? queryText.substring(0, 25) + "..."
                : queryText
              : session.title;
          return { ...session, title: newTitle, messages: updatedMessages };
        }
        return session;
      })
    );

    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Query execution failed.");
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats((prev) =>
        prev.map((session) => {
          if (session.id === currentChatId) {
            return { ...session, messages: [...session.messages, assistantMsg] };
          }
          return session;
        })
      );
    } catch (err: any) {
      const errorMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: "assistant",
        content: `⚠️ Error: ${err.message || "Failed to generate AI response. Please ensure server.py is running and GOOGLE_API_KEY is configured."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats((prev) =>
        prev.map((session) => {
          if (session.id === currentChatId) {
            return { ...session, messages: [...session.messages, errorMsg] };
          }
          return session;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    setReindexMsg(null);
    try {
      const res = await fetch(`${API_BASE_URL}/reindex`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReindexMsg("✅ Knowledge Base re-indexed!");
      } else {
        setReindexMsg(`❌ ${data.detail || "Reindex failed"}`);
      }
    } catch {
      setReindexMsg("❌ Server unreachable");
    } finally {
      setIsReindexing(false);
      setTimeout(() => setReindexMsg(null), 4000);
    }
  };

  const starterPrompts = [
    "Explain the Rewards Architecture in Hyyzo.",
    "How is Rewards Gamification implemented in Flutter?",
    "What are the main cashback features in Hyyzo?",
    "Where is the user documentation stored?"
  ];

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0B0F17] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* --------------------------------------------------------- */}
      {/* SIDEBAR */}
      {/* --------------------------------------------------------- */}
      <aside className={`w-80 flex flex-col border-r ${theme === 'dark' ? 'bg-[#111827] border-gray-800' : 'bg-white border-gray-200'} transition-all`}>
        
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-base leading-tight tracking-wide flex items-center gap-1.5">
                Hyyzo Docs AI
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400">RAG Assistant</span>
            </div>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2 rounded-lg border text-gray-400 hover:text-white transition ${theme === 'dark' ? 'border-gray-800 bg-gray-900/50 hover:bg-gray-800' : 'border-gray-200 bg-gray-100 hover:bg-gray-200'}`}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl border border-gray-800/80 bg-gray-900/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userName}</div>
            <div className="text-[11px] text-gray-400 truncate flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${serverHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {serverHealthy ? "Engine Active" : "Connecting..."}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 space-y-2">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>

          <button
            onClick={handleReindex}
            disabled={isReindexing}
            className={`w-full py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition ${
              theme === 'dark' 
                ? 'border-gray-800 bg-gray-900/60 text-gray-300 hover:bg-gray-800 hover:text-white' 
                : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin text-blue-400' : ''}`} />
            {isReindexing ? "Re-indexing..." : "Re-index Knowledge"}
          </button>

          {reindexMsg && (
            <div className="text-[11px] text-center font-medium py-1 px-2 rounded bg-blue-950/40 text-blue-300 border border-blue-800/40">
              {reindexMsg}
            </div>
          )}
        </div>

        {/* Chat History Section */}
        <div className="flex-1 overflow-y-auto px-3 my-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Chat History
          </div>

          {chats.map((session) => {
            const isActive = session.id === currentChatId;
            return (
              <div
                key={session.id}
                onClick={() => setCurrentChatId(session.id)}
                className={`group px-3 py-2.5 rounded-lg flex items-center justify-between cursor-pointer transition text-xs font-medium ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
                      : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span className="truncate">{session.title}</span>
                </div>
                {chats.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteChat(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Document Explorer Trigger */}
        <div className="p-4 border-t border-gray-800/50">
          <button
            onClick={() => setShowDocsModal(true)}
            className={`w-full p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
              theme === 'dark' ? 'border-gray-800 bg-gray-900/50 text-gray-300 hover:bg-gray-800' : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-indigo-400" />
              <span>Loaded Docs</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400 font-bold">
              {docFiles.length} files
            </span>
          </button>
        </div>

      </aside>

      {/* --------------------------------------------------------- */}
      {/* MAIN CHAT WORKSPACE */}
      {/* --------------------------------------------------------- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Bar */}
        <header className={`h-14 border-b flex items-center justify-between px-6 z-10 ${theme === 'dark' ? 'border-gray-800/80 bg-[#0B0F17]/80 backdrop-blur-md' : 'border-gray-200 bg-white/80 backdrop-blur-md'}`}>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-gray-400">Workspace</span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
            <span className="text-blue-400">{currentChat?.title || "Conversation"}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Gemini RAG Online</span>
            </div>
          </div>
        </header>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
          
          {/* Empty State Hero */}
          {(!currentChat || currentChat.messages.length === 0) && (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>

              <div className="space-y-2 max-w-lg">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Hello, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{userName}</span>
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Ask any questions about your Hyyzo codebase, technical rules, API definitions, or architecture docs.
                </p>
              </div>

              {/* Starter Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl pt-4">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className={`p-4 rounded-xl text-left border text-xs leading-snug transition flex flex-col justify-between group ${
                      theme === 'dark'
                        ? 'border-gray-800 bg-gray-900/50 hover:bg-gray-800/80 hover:border-blue-500/40 text-gray-300'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm'
                    }`}
                  >
                    <span>{prompt}</span>
                    <span className="text-blue-400 group-hover:translate-x-1 transition-transform self-end mt-2">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Render Messages */}
          {currentChat?.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 md:p-5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10"
                    : theme === 'dark'
                      ? "bg-gray-900/80 border border-gray-800 text-gray-200 rounded-tl-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {/* Sources Section for Assistant */}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-800/60">
                    <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      Document References ({msg.sources.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-gray-800/70 border border-gray-700/60 text-blue-400 text-xs font-medium flex items-center gap-1.5"
                          title={src.snippet || src.file}
                        >
                          <FileText className="w-3 h-3" />
                          <span>{src.file}</span>
                          <span className="text-[10px] text-gray-400 bg-gray-900 px-1.5 py-0.5 rounded">
                            {src.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-[10px] opacity-50 mt-2 text-right">{msg.timestamp}</div>
              </div>

              {msg.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-md">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 animate-pulse">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-gray-900/80 border border-gray-800 text-gray-400 text-xs flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Searching vector index & generating response...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* --------------------------------------------------------- */}
        {/* FLOATING CHAT COMPOSER */}
        {/* --------------------------------------------------------- */}
        <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`rounded-2xl border p-2 flex items-center gap-2 shadow-xl transition focus-within:border-blue-500/60 ${
              theme === 'dark' ? 'bg-[#111827]/90 border-gray-800' : 'bg-white border-gray-200'
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about Hyyzo documentation..."
              className="flex-1 bg-transparent px-4 py-2.5 text-sm focus:outline-none placeholder:text-gray-500"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[11px] text-gray-500 text-center mt-2">
            Hyyzo Docs AI is grounded in local documentation (`docs/`).
          </div>
        </div>

      </main>

      {/* --------------------------------------------------------- */}
      {/* DOCUMENT EXPLORER MODAL */}
      {/* --------------------------------------------------------- */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Folder className="w-4 h-4 text-blue-400" />
                <span>Knowledge Base Documents ({docFiles.length})</span>
              </div>
              <button
                onClick={() => setShowDocsModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto space-y-2">
              {docFiles.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-gray-800 bg-gray-900/50 flex items-center justify-between hover:bg-gray-800/50 transition text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-medium text-gray-200">{doc.name}</div>
                      <div className="text-[10px] text-gray-500">{doc.path}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {(doc.size_bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
