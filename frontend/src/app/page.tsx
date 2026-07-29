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
  ExternalLink,
  Paperclip,
  ArrowUp
} from "lucide-react";

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

export default function VercelAIChatbot() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelSelected, setModelSelected] = useState("gemini-2.0-flash");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<DocFile[]>([]);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState<string | null>(null);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [expandedSources, setExpandedSources] = useState<{ [key: string]: boolean }>({});

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("hyyzo-theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
    const savedModel = localStorage.getItem("hyyzo-model");
    if (savedModel) {
      setModelSelected(savedModel);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("hyyzo-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const handleModelChange = (newModel: string) => {
    setModelSelected(newModel);
    localStorage.setItem("hyyzo-model", newModel);
  };

  useEffect(() => {
    const defaultChatId = Math.random().toString(36).substring(2, 9);
    const initialSession: ChatSession = {
      id: defaultChatId,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChats([initialSession]);
    setCurrentChatId(defaultChatId);

    checkHealth();
    fetchDocsList();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, currentChatId, isLoading]);

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

  const currentChat = chats.find((c) => c.id === currentChatId) || chats[0];

  const handleNewChat = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    const newSession: ChatSession = {
      id: newId,
      title: "New Chat",
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

    setChats((prev) =>
      prev.map((session) => {
        if (session.id === currentChatId) {
          const updatedMessages = [...session.messages, userMsg];
          const newTitle =
            session.messages.length === 0
              ? queryText.length > 24
                ? queryText.substring(0, 24) + "..."
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: queryText, model: modelSelected })
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
        content: `⚠️ Error: ${err.message || "Unable to reach RAG server"}`,
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
      const res = await fetch("http://localhost:8000/api/reindex", { method: "POST" });
      if (res.ok) {
        setReindexMsg("Knowledge base re-indexed!");
      } else {
        setReindexMsg("Reindex failed");
      }
    } catch {
      setReindexMsg("Server unreachable");
    } finally {
      setIsReindexing(false);
      setTimeout(() => setReindexMsg(null), 3000);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const promptSuggestions = [
    { title: "Rewards Architecture", desc: "Explain the Hyyzo cashback and rewards flow." },
    { title: "Gamification Engine", desc: "How are gamification rules configured in Flutter?" },
    { title: "Features & Products", desc: "Summarize main product modules in docs." },
    { title: "Loaded Knowledge", desc: "List all indexed files available in knowledge storage." }
  ];

  return (
    <div className={`flex h-screen w-screen font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#09090b] text-zinc-100' : 'bg-[#fcfcfd] text-zinc-900'
    }`}>
      
      {/* --------------------------------------------------------- */}
      {/* SIDEBAR (VERCEL V0 STYLE) */}
      {/* --------------------------------------------------------- */}
      <aside
        className={`${
          sidebarOpen ? "w-64 border-r" : "w-0 overflow-hidden border-none"
        } flex flex-col h-full transition-all duration-200 z-20 ${
          theme === 'dark' ? 'bg-[#121215] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
        }`}
      >
        {/* Sidebar Header */}
        <div className={`p-3 flex items-center justify-between border-b ${
          theme === 'dark' ? 'border-zinc-800/50' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-800 shadow-xs'
            }`}>
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <span className={`font-semibold text-sm tracking-tight ${
              theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
            }`}>
              Hyyzo Docs AI
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className={`p-1.5 rounded-lg transition ${
              theme === 'dark'
                ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60'
            }`}
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className={`w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] ${
              theme === 'dark'
                ? 'bg-zinc-100 hover:bg-white text-zinc-950'
                : 'bg-zinc-900 hover:bg-zinc-800 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        {/* Chat History Sessions */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className={`px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${
            theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            Recent Conversations
          </div>

          {chats.map((session) => {
            const isActive = session.id === currentChatId;
            return (
              <div
                key={session.id}
                onClick={() => setCurrentChatId(session.id)}
                className={`group px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition text-xs font-medium ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-zinc-800/90 text-zinc-100 font-semibold'
                      : 'bg-zinc-200/80 text-zinc-900 font-semibold'
                    : theme === 'dark'
                      ? 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                      : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{session.title}</span>
                </div>
                {chats.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteChat(session.id, e)}
                    className={`opacity-0 group-hover:opacity-100 p-1 transition ${
                      theme === 'dark' ? 'text-zinc-400 hover:text-rose-400' : 'text-zinc-500 hover:text-rose-600'
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
        <div className={`p-3 border-t space-y-2 ${
          theme === 'dark' ? 'border-zinc-800/60' : 'border-zinc-200'
        }`}>
          <button
            onClick={handleReindex}
            disabled={isReindexing}
            className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
              theme === 'dark'
                ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isReindexing ? 'animate-spin text-blue-500' : ''}`} />
              <span>Re-index Index</span>
            </div>
            {reindexMsg && <span className="text-[10px] text-emerald-500 font-bold">{reindexMsg}</span>}
          </button>

          <button
            onClick={() => setShowDocsModal(true)}
            className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
              theme === 'dark'
                ? 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300'
                : 'border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`} />
              <span>Document Files</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              theme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {docFiles.length}
            </span>
          </button>
        </div>

      </aside>

      {/* --------------------------------------------------------- */}
      {/* MAIN CHAT CANVAS */}
      {/* --------------------------------------------------------- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header Bar */}
        <header className={`h-14 border-b flex items-center justify-between px-4 z-10 ${
          theme === 'dark'
            ? 'bg-[#09090b]/90 border-zinc-800/80 backdrop-blur-md'
            : 'bg-white/90 border-zinc-200 backdrop-blur-md'
        }`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className={`p-1.5 rounded-lg transition ${
                  theme === 'dark'
                    ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            {/* Model Selector Pill */}
            <div className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${
              theme === 'dark'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-300'
                : 'bg-zinc-100 border-zinc-300 text-zinc-700'
            }`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <select
                value={modelSelected}
                onChange={(e) => handleModelChange(e.target.value)}
                className="bg-transparent border-none outline-none font-medium cursor-pointer appearance-none pr-4 text-xs"
              >
                <option value="gemini-2.5-flash" className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>
                  Google Gemini 2.5 Flash
                </option>
                <option value="gemini-2.0-flash" className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>
                  Google Gemini 2.0 Flash
                </option>
                <option value="gemini-2.0-flash-lite" className={theme === 'dark' ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'}>
                  Google Gemini 2.0 Flash Lite
                </option>
              </select>
              <ChevronDown className={`w-3 h-3 pointer-events-none absolute right-2.5 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-1.5 rounded-lg transition ${
                theme === 'dark'
                  ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </header>

        {/* Message Container Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-0 py-6 max-w-3xl mx-auto w-full space-y-6">
          
          {/* Empty State Suggestion Grid */}
          {(!currentChat || currentChat.messages.length === 0) && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
              }`}>
                <Sparkles className="w-6 h-6 text-blue-500" />
              </div>

              <div className="space-y-2 max-w-md">
                <h1 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'}`}>
                  What would you like to know?
                </h1>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Search & explore project documentation, rewards system architecture, and API definitions.
                </p>
              </div>

              {/* Vercel AI Chatbot Prompt Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left">
                {promptSuggestions.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt.title)}
                    className={`p-4 rounded-xl border transition text-left space-y-1 group ${
                      theme === 'dark'
                        ? 'border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300 shadow-xs'
                    }`}
                  >
                    <div className={`text-xs font-semibold flex items-center justify-between ${
                      theme === 'dark' ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-800 group-hover:text-zinc-950'
                    }`}>
                      <span>{prompt.title}</span>
                      <ArrowUp className={`w-3 h-3 rotate-45 transition-transform ${
                        theme === 'dark' ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-700'
                      }`} />
                    </div>
                    <div className={`text-[11px] leading-snug ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'}`}>{prompt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {currentChat?.messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              <div className="flex gap-3 text-sm">
                
                {/* Avatar Icon */}
                {msg.role === "assistant" ? (
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800 shadow-xs'
                  }`}>
                    <Bot className="w-4 h-4 text-blue-500" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs mt-0.5">
                    U
                  </div>
                )}

                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      {msg.role === "assistant" ? "Hyyzo AI Assistant" : "You"}
                    </span>
                    <span className={`text-[10px] ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{msg.timestamp}</span>
                  </div>

                  {/* Message Content */}
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user" 
                      ? theme === 'dark'
                        ? "text-zinc-100 bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl"
                        : "text-zinc-900 bg-zinc-100 border border-zinc-200 p-3.5 rounded-xl"
                      : theme === 'dark'
                        ? "text-zinc-200"
                        : "text-zinc-800"
                  }`}>
                    {msg.content}
                  </div>

                  {/* Document Sources Collapsible */}
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleSources(msg.id)}
                        className={`text-xs font-medium flex items-center gap-1.5 py-1 px-2.5 rounded-lg border transition ${
                          theme === 'dark'
                            ? 'text-zinc-400 hover:text-zinc-200 border-zinc-800 bg-zinc-900/50'
                            : 'text-zinc-600 hover:text-zinc-900 border-zinc-200 bg-zinc-100/80'
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
                        <div className={`mt-2 space-y-2 pl-2 border-l-2 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-300'}`}>
                          {msg.sources.map((src, i) => (
                            <div key={i} className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                              theme === 'dark'
                                ? 'bg-zinc-900/60 border-zinc-800'
                                : 'bg-white border-zinc-200 shadow-xs'
                            }`}>
                              <div className="flex items-center justify-between font-medium text-blue-500">
                                <span>📄 {src.file}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  theme === 'dark' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
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

                  {/* Actions Toolbar for Assistant */}
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id)}
                        className={`p-1 rounded transition ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'}`}
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button className={`p-1 rounded transition ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'}`} title="Good Response">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button className={`p-1 rounded transition ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'}`} title="Bad Response">
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 text-sm">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800 shadow-xs'
              }`}>
                <Bot className="w-4 h-4 animate-spin text-blue-500" />
              </div>
              <div className={`text-xs flex items-center gap-2 py-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                <span>Retrieving context & drafting answer...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* --------------------------------------------------------- */}
        {/* VERCEL STYLE FLOATING COMPOSER */}
        {/* --------------------------------------------------------- */}
        <div className="p-4 max-w-3xl mx-auto w-full">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`rounded-2xl border p-2 transition ${
              theme === 'dark'
                ? 'border-zinc-800 bg-[#121215]/90 shadow-2xl focus-within:border-zinc-700'
                : 'border-zinc-300 bg-white/90 shadow-xl focus-within:border-zinc-400'
            }`}
          >
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Send a message to Hyyzo Docs AI..."
              className={`w-full bg-transparent px-3 py-1.5 text-sm focus:outline-none resize-none ${
                theme === 'dark' ? 'text-zinc-100 placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'
              }`}
            />

            <div className={`flex items-center justify-between px-2 pt-1 border-t ${
              theme === 'dark' ? 'border-zinc-800/40' : 'border-zinc-200'
            }`}>
              <div className={`flex items-center gap-2 text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                <Paperclip className={`w-3.5 h-3.5 cursor-pointer transition ${
                  theme === 'dark' ? 'hover:text-zinc-300' : 'hover:text-zinc-700'
                }`} />
                <span>RAG Enabled</span>
              </div>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`p-2 rounded-xl disabled:opacity-30 transition flex items-center justify-center shrink-0 ${
                  theme === 'dark'
                    ? 'bg-zinc-100 hover:bg-white text-zinc-950'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                }`}
              >
                <ArrowUp className="w-4 h-4 font-bold" />
              </button>
            </div>
          </form>
          <div className={`text-[10px] text-center mt-2 ${theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Hyyzo Docs AI — Answers are strictly grounded in project documentation.
          </div>
        </div>

      </main>

      {/* Loaded Docs Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl ${
            theme === 'dark' ? 'bg-[#121215] border-zinc-800' : 'bg-white border-zinc-200'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
            }`}>
              <span className={`text-xs font-semibold ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-900'}`}>
                Loaded Documents ({docFiles.length})
              </span>
              <button
                onClick={() => setShowDocsModal(false)}
                className={`text-xs transition ${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-200' : 'text-zinc-400 hover:text-zinc-700'}`}
              >
                ✕
              </button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {docFiles.map((doc, i) => (
                <div key={i} className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                  theme === 'dark'
                    ? 'border-zinc-800/80 bg-zinc-900/50'
                    : 'border-zinc-200 bg-zinc-50'
                }`}>
                  <div className="truncate pr-2">
                    <div className={`font-medium truncate ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`}>{doc.name}</div>
                    <div className={`text-[10px] truncate ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>{doc.path}</div>
                  </div>
                  <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
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
