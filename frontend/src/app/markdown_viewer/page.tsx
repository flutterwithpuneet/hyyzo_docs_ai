"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  BookOpen,
  Search,
  FileText,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Clock,
  HardDrive,
  Menu,
  X,
  Moon,
  Sun,
  Sparkles,
  Layers,
  Server,
  Database,
  Code2,
  Smartphone,
  Globe,
  ListFilter,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Hash
} from "lucide-react";
import VercelLogin, { AuthUser } from "@/components/VercelLogin";
import { auth, fbSignOut, onAuthStateChanged } from "@/lib/firebase";
import { isSessionExpired, clearSession } from "@/lib/firestoreService";

interface DocItem {
  name: string;
  path: string;
  category: string;
  title: string;
  sizeBytes: number;
  sizeFormatted: string;
  wordCount: number;
  readingTimeMinutes: number;
}

interface DocContent {
  path: string;
  name: string;
  title: string;
  content: string;
  sizeBytes: number;
  sizeFormatted: string;
  wordCount: number;
  readingTimeMinutes: number;
  lastModified: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Core Docs": <BookOpen className="w-4 h-4 text-amber-500" />,
  "Architecture": <Layers className="w-4 h-4 text-blue-500" />,
  "Backend & API": <Server className="w-4 h-4 text-emerald-500" />,
  "Database": <Database className="w-4 h-4 text-purple-500" />,
  "Engineering Guidelines": <Code2 className="w-4 h-4 text-cyan-500" />,
  "Flutter Mobile": <Smartphone className="w-4 h-4 text-sky-500" />,
  "Web Application": <Globe className="w-4 h-4 text-indigo-500" />,
  "Frontend": <Globe className="w-4 h-4 text-indigo-500" />,
};

function MarkdownViewerLoader({
  subtitle = "Verifying authorization & decrypting document...",
  targetFile,
  theme = "dark",
}: {
  subtitle?: string;
  targetFile?: string | null;
  theme?: "dark" | "light";
}) {
  const isDark = theme === "dark";
  return (
    <div className={`h-screen w-screen flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors ${
      isDark ? "bg-[#0D0E12] text-zinc-200" : "bg-[#F8F9FA] text-zinc-800"
    }`}>
      {/* Ambient background glow */}
      <div className={`absolute w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 -top-20 -left-20 ${
        isDark ? "bg-blue-600" : "bg-blue-400"
      }`} />
      <div className={`absolute w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 -bottom-20 -right-20 ${
        isDark ? "bg-indigo-600" : "bg-indigo-300"
      }`} />

      {/* Center Loader Card */}
      <div className={`relative max-w-sm w-full rounded-2xl border p-7 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-300 ${
        isDark ? "bg-[#13151D]/90 border-[#222533] shadow-black/60" : "bg-white/95 border-zinc-200 shadow-xl shadow-zinc-900/5"
      }`}>
        
        {/* Brand Icon with Spinner Ring */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/25">
            <div className={`w-full h-full rounded-2xl flex items-center justify-center ${
              isDark ? "bg-[#13151D]" : "bg-white"
            }`}>
              <Sparkles className="w-7 h-7 text-blue-500 animate-pulse" />
            </div>
          </div>
          {/* Outer rotating dashed ring */}
          <div className="absolute -inset-2 border-2 border-blue-500/30 border-dashed rounded-full animate-spin [animation-duration:8s]" />
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-1.5">
          <h3 className={`text-base font-bold tracking-tight ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
            Hyyzo Technical Docs
          </h3>
          <p className="text-xs text-zinc-400 font-medium">
            {subtitle}
          </p>
        </div>

        {/* Target Document Badge if present */}
        {targetFile && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-mono max-w-full truncate ${
            isDark ? "bg-[#181A24] border-[#292D3D] text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700"
          }`}>
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{targetFile}</span>
          </div>
        )}

        {/* Animated Progress Bar */}
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
          isDark ? "bg-zinc-800" : "bg-zinc-100"
        }`}>
          <div className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 rounded-full animate-pulse w-full" />
        </div>

        {/* Security / Admin Badge */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Role-Based Access Control Active</span>
        </div>
      </div>
    </div>
  );
}

function MarkdownViewerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileQuery = searchParams.get("file");

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  // Documentation State
  const [docsList, setDocsList] = useState<DocItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(fileQuery || "about_hyyzo.md");
  const [currentDoc, setCurrentDoc] = useState<DocContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [docLoading, setDocLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copied, setCopied] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const contentRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Initialize theme from localStorage or system & update document root class
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(initialTheme);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(next);
  };

  // Sign out handler
  const handleSignOut = async () => {
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
    setShowLogoutModal(false);
  };

  // Check Authentication & Firebase Session
  useEffect(() => {
    const savedUser = localStorage.getItem("hyyzo_auth_user");
    if (savedUser) {
      try {
        if (isSessionExpired()) {
          handleSignOut();
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
            handleSignOut();
          } else {
            const authUser: AuthUser = {
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Hyyzo User",
              photoURL: fbUser.photoURL,
              phoneNumber: fbUser.phoneNumber || undefined,
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

  // Fetch docs list once authenticated
  useEffect(() => {
    if (!currentUser) return;

    async function fetchDocs() {
      try {
        setLoading(true);
        const res = await fetch("/api/docs");
        if (res.ok) {
          const data = await res.json();
          setDocsList(data.documents || []);

          // Match query parameter or default to first doc
          if (fileQuery) {
            const match = data.documents.find(
              (d: DocItem) =>
                d.path.toLowerCase() === fileQuery.toLowerCase() ||
                d.name.toLowerCase() === fileQuery.toLowerCase() ||
                d.path.toLowerCase().includes(fileQuery.toLowerCase())
            );
            if (match) setSelectedFile(match.path);
          } else if (data.documents.length > 0) {
            setSelectedFile(data.documents[0].path);
          }
        }
      } catch (err) {
        console.error("Failed to load documents list:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, [currentUser, fileQuery]);

  // Fetch active document content
  useEffect(() => {
    if (!currentUser || !selectedFile) return;

    async function fetchDoc() {
      try {
        setDocLoading(true);
        const res = await fetch(`/api/docs?file=${encodeURIComponent(selectedFile)}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentDoc(data);
          // Scroll content back to top
          if (contentRef.current) {
            contentRef.current.scrollTop = 0;
          }
        }
      } catch (err) {
        console.error("Failed to fetch doc content:", err);
      } finally {
        setDocLoading(false);
      }
    }
    fetchDoc();
  }, [currentUser, selectedFile]);

  // Handle file select & sync URL
  const handleSelectDoc = (filePath: string) => {
    setSelectedFile(filePath);
    const url = new URL(window.location.href);
    url.searchParams.set("file", filePath);
    window.history.pushState({}, "", url.toString());
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.push("/");
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("doc-search-input")?.focus();
      }
      if (e.key === "[" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Generate Table of Contents from markdown headings
  const tocList: TocItem[] = useMemo(() => {
    if (!currentDoc?.content) return [];
    const lines = currentDoc.content.split("\n");
    const headings: TocItem[] = [];

    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim().replace(/[\*\_`]/g, "");
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        headings.push({ id, text, level });
      }
    });

    return headings;
  }, [currentDoc?.content]);

  // Scroll spy for TOC
  const scrollToHeading = (id: string) => {
    setActiveTocId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Grouped docs by category
  const groupedDocs = useMemo(() => {
    const filtered = docsList.filter(
      (d) =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, DocItem[]> = {};
    filtered.forEach((d) => {
      if (!groups[d.category]) groups[d.category] = [];
      groups[d.category].push(d);
    });

    return groups;
  }, [docsList, searchQuery]);

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const copyFullMarkdown = () => {
    if (!currentDoc?.content) return;
    navigator.clipboard.writeText(currentDoc.content);
    setCopied(true);
    showToast("Raw markdown copied to clipboard 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    showToast("Document link copied to clipboard 🔗");
    setTimeout(() => setShareCopied(false), 2000);
  };

  const isDark = theme === "dark";

  // -------------------------------------------------------------
  // AUTHENTICATION GATE: Block unauthorized users from accessing docs
  // -------------------------------------------------------------
  if (!currentUser && authInitialized) {
    return (
      <VercelLogin
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          localStorage.setItem("hyyzo_auth_user", JSON.stringify(u));
        }}
        theme={theme}
      />
    );
  }

  // Loading Screen while verifying session or initial document fetch
  if (!authInitialized) {
    return (
      <MarkdownViewerLoader
        subtitle="Verifying authorization & security keys..."
        targetFile={fileQuery}
        theme={theme}
      />
    );
  }

  // Initial load when user is authorized but document list & initial doc are loading
  if (currentUser && loading && !currentDoc) {
    return (
      <MarkdownViewerLoader
        subtitle="Decrypting technical specification..."
        targetFile={fileQuery || selectedFile}
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
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${
      isDark ? "bg-[#0D0E12] text-[#ECEFF4]" : "bg-[#FFFFFF] text-[#111827]"
    }`}>
      
      {/* Top Navigation Bar */}
      <header className={`h-14 shrink-0 border-b flex items-center justify-between px-4 z-20 backdrop-blur-md transition-colors ${
        isDark ? "bg-[#13151D]/90 border-[#222533]" : "bg-white/95 border-[#E5E7EB]"
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
              isDark
                ? "bg-[#1C1F2B] hover:bg-[#262A3B] border-[#2A2E40] text-zinc-300 hover:text-white"
                : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black shadow-xs"
            }`}
            title="Return to AI Chat (Esc)"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assistant</span>
            <kbd className={`text-[10px] px-1 rounded font-mono ml-1 ${
              isDark ? "bg-white/10 text-zinc-400" : "bg-zinc-200/80 text-zinc-600"
            }`}>Esc</kbd>
          </button>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer border ${
              isDark
                ? "bg-[#1C1F2B] hover:bg-[#262A3B] border-[#2A2E40] text-zinc-400 hover:text-zinc-200"
                : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-xs"
            }`}
            title="Toggle Sidebar ([)"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-blue-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Hyyzo Docs
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className={`font-medium truncate max-w-[200px] ${
              isDark ? "text-zinc-300" : "text-zinc-600"
            }`}>
              {currentDoc?.title || currentDoc?.name || selectedFile}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {currentDoc && (
            <>
              <button
                onClick={() => router.push(`/?prompt=${encodeURIComponent(`Explain the architecture and technical details of ${currentDoc.name}`)}`)}
                className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  isDark
                    ? "bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 text-blue-400"
                    : "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 shadow-xs"
                }`}
                title="Ask AI questions regarding this document"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span>Ask AI About Doc</span>
              </button>

              <button
                onClick={copyFullMarkdown}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  isDark
                    ? "bg-[#1C1F2B] hover:bg-[#262A3B] border-[#2A2E40] text-zinc-300"
                    : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-xs"
                }`}
                title="Copy raw markdown content"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy Raw"}</span>
              </button>

              <button
                onClick={copyShareLink}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer border ${
                  isDark
                    ? "bg-[#1C1F2B] hover:bg-[#262A3B] border-[#2A2E40] text-zinc-300"
                    : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700 shadow-xs"
                }`}
                title="Share Document Link"
              >
                {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              </button>
            </>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-1.5 rounded-lg text-xs transition cursor-pointer border ${
              isDark
                ? "bg-[#1C1F2B] hover:bg-[#262A3B] border-[#2A2E40] text-amber-400 hover:text-amber-300"
                : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-indigo-600 hover:text-indigo-700 shadow-xs"
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile / Sign Out Pill */}
          <div className="flex items-center gap-1.5 pl-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-xs ${
                isDark
                  ? "bg-blue-600 text-white border-blue-400"
                  : "bg-blue-600 text-white border-blue-500"
              }`}
              title={currentUser?.email || currentUser?.displayName || "User"}
            >
              {userInitials}
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              className={`p-1.5 rounded-lg transition cursor-pointer border ${
                isDark
                  ? "border-[#2A2E40] bg-[#1C1F2B] hover:bg-rose-500/15 text-zinc-400 hover:text-rose-400"
                  : "border-zinc-200 bg-zinc-50 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 shadow-xs"
              }`}
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar: Document Explorer */}
        <aside
          className={`shrink-0 border-r flex flex-col transition-all duration-200 ease-in-out z-10 ${
            sidebarOpen ? "w-72 sm:w-80" : "w-0 -translate-x-full overflow-hidden"
          } ${isDark ? "bg-[#13151D] border-[#222533]" : "bg-[#F7F8FA] border-[#E5E7EB]"}`}
        >
          {/* Search Box */}
          <div className={`p-3 border-b ${isDark ? "border-[#222533]" : "border-[#E5E7EB]"}`}>
            <div className={`relative flex items-center rounded-lg border px-2.5 py-1.5 text-xs transition ${
              isDark
                ? "bg-[#181A24] border-[#292D3D] text-white focus-within:border-blue-500"
                : "bg-white border-zinc-200 text-zinc-900 focus-within:border-blue-500 shadow-xs"
            }`}>
              <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-2" />
              <input
                id="doc-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter 15 documents..."
                className="w-full bg-transparent outline-none placeholder:text-zinc-400 text-xs"
              />
              <kbd className={`hidden sm:inline-block text-[9px] px-1 py-0.5 rounded font-mono ${
                isDark ? "bg-white/10 text-zinc-400" : "bg-zinc-100 text-zinc-500"
              }`}>
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Document Tree Navigation */}
          <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
            {loading ? (
              <div className="p-6 text-center text-xs text-zinc-400">Loading document tree...</div>
            ) : Object.keys(groupedDocs).length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">No documents match "{searchQuery}"</div>
            ) : (
              Object.entries(groupedDocs).map(([category, items]) => {
                const isCollapsed = collapsedCategories[category];
                return (
                  <div key={category} className="space-y-1">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className={`w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
                        isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {CATEGORY_ICONS[category] || <FileText className="w-3.5 h-3.5" />}
                        <span>{category}</span>
                        <span className="text-[10px] font-normal lowercase opacity-70">({items.length})</span>
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                    </button>

                    {/* Category Documents */}
                    {!isCollapsed && (
                      <div className="space-y-0.5 pl-1.5">
                        {items.map((doc) => {
                          const isSelected = selectedFile === doc.path || selectedFile === doc.name;
                          return (
                            <button
                              key={doc.path}
                              onClick={() => handleSelectDoc(doc.path)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs transition group cursor-pointer ${
                                isSelected
                                  ? isDark
                                    ? "bg-blue-600/15 text-blue-400 border border-blue-500/30 font-medium"
                                    : "bg-blue-50 text-blue-700 border border-blue-200 font-medium shadow-xs"
                                  : isDark
                                    ? "text-zinc-400 hover:text-zinc-200 hover:bg-[#1A1D28] border border-transparent"
                                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-blue-500" : "text-zinc-400"}`} />
                                <span className="truncate">{doc.title}</span>
                              </div>
                              <span className={`text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-800"
                                  : isDark ? "bg-[#1E212D] text-zinc-500 group-hover:text-zinc-400" : "bg-zinc-200/80 text-zinc-500"
                              }`}>
                                {doc.sizeFormatted}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Footer Info */}
          <div className={`p-3 border-t text-[11px] flex items-center justify-between ${
            isDark ? "border-[#222533] bg-[#101219] text-zinc-500" : "border-[#E5E7EB] bg-[#F1F3F5] text-zinc-600"
          }`}>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Admin Approved</span>
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <HardDrive className="w-3 h-3 text-blue-500" />
              15 Docs
            </span>
          </div>
        </aside>

        {/* Center: Notion Style Canvas */}
        <main
          ref={contentRef}
          className={`flex-1 overflow-y-auto px-4 sm:px-8 md:px-14 lg:px-20 py-8 relative custom-scrollbar scroll-smooth ${
            isDark ? "bg-[#0D0E12]" : "bg-[#FFFFFF]"
          }`}
        >
          {docLoading || loading ? (
            <div className="max-w-3xl mx-auto space-y-6 animate-pulse pt-10">
              <div className={`h-8 rounded-lg w-2/3 ${isDark ? "bg-zinc-800/40" : "bg-zinc-200"}`}></div>
              <div className={`h-4 rounded w-1/3 ${isDark ? "bg-zinc-800/30" : "bg-zinc-200"}`}></div>
              <div className="space-y-3 pt-6">
                <div className={`h-4 rounded ${isDark ? "bg-zinc-800/20" : "bg-zinc-100"}`}></div>
                <div className={`h-4 rounded ${isDark ? "bg-zinc-800/20" : "bg-zinc-100"}`}></div>
                <div className={`h-4 rounded w-5/6 ${isDark ? "bg-zinc-800/20" : "bg-zinc-100"}`}></div>
              </div>
            </div>
          ) : currentDoc ? (
            <div className="max-w-3xl mx-auto pb-24">
              
              {/* Notion Doc Header Banner */}
              <div className={`mb-8 pb-6 border-b space-y-3 ${isDark ? "border-[#222533]" : "border-[#E5E7EB]"}`}>
                {/* Doc Category Pill & Stats */}
                <div className={`flex flex-wrap items-center gap-2 text-xs ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                  <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] border font-mono ${
                    isDark ? "bg-[#1C1F2B] border-[#2A2E40] text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-700"
                  }`}>
                    {currentDoc.path}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    {currentDoc.readingTimeMinutes} min read ({currentDoc.wordCount} words)
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                    {currentDoc.sizeFormatted}
                  </span>
                </div>

                {/* Page Title */}
                <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  isDark ? "text-zinc-50" : "text-zinc-900"
                }`}>
                  {currentDoc.title}
                </h1>
              </div>

              {/* Markdown Content with Notion Styling */}
              <div className="max-w-none text-[15px] leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => {
                      const text = String(children);
                      const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                      return (
                        <h1 id={id} className={`text-2xl sm:text-3xl font-bold mt-8 mb-4 pt-4 border-t first:border-0 first:pt-0 group flex items-center justify-between ${
                          isDark ? "border-zinc-800 text-zinc-50" : "border-zinc-200 text-zinc-900"
                        }`}>
                          <span>{children}</span>
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}${window.location.pathname}?file=${encodeURIComponent(selectedFile)}#${id}`;
                              navigator.clipboard.writeText(url);
                              showToast(`Section link copied (#${id}) 📍`);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 text-base transition cursor-pointer p-1 rounded"
                            title="Copy link to this section"
                          >
                            <Hash className="w-4 h-4" />
                          </button>
                        </h1>
                      );
                    },
                    h2: ({ children }) => {
                      const text = String(children);
                      const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                      return (
                        <h2 id={id} className={`text-xl font-bold mt-7 mb-3 group flex items-center justify-between ${
                          isDark ? "text-zinc-100" : "text-zinc-900"
                        }`}>
                          <span>{children}</span>
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}${window.location.pathname}?file=${encodeURIComponent(selectedFile)}#${id}`;
                              navigator.clipboard.writeText(url);
                              showToast(`Section link copied (#${id}) 📍`);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-blue-500 text-sm transition cursor-pointer p-1 rounded"
                            title="Copy link to this section"
                          >
                            <Hash className="w-3.5 h-3.5" />
                          </button>
                        </h2>
                      );
                    },
                    h3: ({ children }) => {
                      const text = String(children);
                      const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                      return (
                        <h3 id={id} className={`text-lg font-semibold mt-5 mb-2 ${
                          isDark ? "text-zinc-200" : "text-zinc-800"
                        }`}>
                          {children}
                        </h3>
                      );
                    },
                    p: ({ children }) => (
                      <div className={`my-3 leading-relaxed font-normal ${
                        isDark ? "text-zinc-300" : "text-zinc-800"
                      }`}>
                        {children}
                      </div>
                    ),
                    ul: ({ children }) => (
                      <ul className={`my-3 space-y-1.5 list-disc list-inside ${
                        isDark ? "text-zinc-300" : "text-zinc-800"
                      }`}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className={`my-3 space-y-1.5 list-decimal list-inside ${
                        isDark ? "text-zinc-300" : "text-zinc-800"
                      }`}>
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className={`pl-1 ${isDark ? "text-zinc-300" : "text-zinc-800"}`}>{children}</li>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className={`my-4 p-4 rounded-xl border-l-4 shadow-xs ${
                        isDark ? "bg-[#181A24] border-l-blue-500 text-zinc-300" : "bg-blue-50/80 border-l-blue-600 text-zinc-800"
                      }`}>
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className={`overflow-x-auto my-6 rounded-xl border shadow-xs ${
                        isDark ? "border-zinc-800 bg-[#14161E]" : "border-zinc-200 bg-white"
                      }`}>
                        <table className="min-w-full divide-y divide-inherit text-xs">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className={isDark ? "bg-[#181B26] text-zinc-200 font-semibold" : "bg-zinc-100 text-zinc-800 font-semibold"}>
                        {children}
                      </thead>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-[11px]">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className={`px-4 py-2.5 whitespace-normal border-t ${
                        isDark ? "border-zinc-800/80 text-zinc-300" : "border-zinc-200 text-zinc-800"
                      }`}>
                        {children}
                      </td>
                    ),
                    pre: ({ children }: any) => {
                      return (
                        <div className={`my-4 rounded-xl border overflow-hidden font-mono text-xs ${
                          isDark ? "bg-[#14161F] border-[#272B3C]" : "bg-[#F8F9FB] border-zinc-200 shadow-xs"
                        }`}>
                          {children}
                        </div>
                      );
                    },
                    code: ({ className, children, ...props }: any) => {
                      const isBlock = Boolean(className?.includes("language-") || (typeof children === "string" && children.includes("\n")));
                      const rawCode = String(children).replace(/\n$/, "");
                      const langMatch = className?.match(/language-(\w+)/);
                      const lang = langMatch ? langMatch[1] : "code";

                      if (isBlock) {
                        return (
                          <div>
                            <div className={`flex items-center justify-between px-3.5 py-1.5 border-b text-[10px] ${
                              isDark ? "bg-black/30 border-[#272B3C] text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-600 font-medium"
                            }`}>
                              <span className="uppercase font-semibold tracking-wider">{lang}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(rawCode);
                                  showToast("Code snippet copied to clipboard 💻");
                                }}
                                className={`transition flex items-center gap-1 cursor-pointer py-0.5 px-1.5 rounded ${
                                  isDark ? "hover:text-white hover:bg-white/10" : "hover:text-black hover:bg-zinc-200 text-zinc-700"
                                }`}
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                            <div className={`p-4 overflow-x-auto ${isDark ? "text-zinc-200" : "text-zinc-900"}`}>
                              <code className="font-mono text-xs leading-relaxed">{children}</code>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <code
                          className={`px-1.5 py-0.5 rounded font-mono text-[12px] font-medium ${
                            isDark ? "bg-[#1E212E] text-amber-400" : "bg-zinc-100 text-rose-600 border border-zinc-200"
                          }`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {currentDoc.content}
                </ReactMarkdown>
              </div>

              {/* Bottom Nav: Previous & Next Document Links */}
              <div className={`mt-16 pt-8 border-t flex items-center justify-between ${
                isDark ? "border-[#222533]" : "border-[#E5E7EB]"
              }`}>
                <button
                  onClick={() => {
                    const idx = docsList.findIndex((d) => d.path === selectedFile);
                    if (idx > 0) handleSelectDoc(docsList[idx - 1].path);
                  }}
                  disabled={docsList.findIndex((d) => d.path === selectedFile) <= 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark
                      ? "bg-[#181A24] hover:bg-[#202330] border-[#292D3D] text-zinc-300"
                      : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 shadow-xs"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Doc</span>
                </button>

                <button
                  onClick={() => {
                    const idx = docsList.findIndex((d) => d.path === selectedFile);
                    if (idx >= 0 && idx < docsList.length - 1) handleSelectDoc(docsList[idx + 1].path);
                  }}
                  disabled={docsList.findIndex((d) => d.path === selectedFile) >= docsList.length - 1}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark
                      ? "bg-[#181A24] hover:bg-[#202330] border-[#292D3D] text-zinc-300"
                      : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-700 shadow-xs"
                  }`}
                >
                  <span>Next Doc</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-zinc-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Document not found or failed to load.</p>
            </div>
          )}
        </main>

        {/* Right Sidebar: Notion-style On This Page (TOC) */}
        {tocList.length > 1 && (
          <aside className={`hidden xl:block w-64 shrink-0 border-l p-5 overflow-y-auto ${
            isDark ? "border-[#222533] bg-[#12141C]/50" : "border-[#E5E7EB] bg-[#FBFBFC]"
          }`}>
            <div className="sticky top-0 space-y-3">
              <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? "text-zinc-500" : "text-zinc-500"
              }`}>
                <ListFilter className="w-3.5 h-3.5 text-blue-500" />
                <span>On This Page</span>
              </div>

              <nav className="space-y-1 text-xs">
                {tocList.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={`block w-full text-left py-1 truncate transition rounded px-2 ${
                      item.level === 1
                        ? isDark ? "font-semibold text-zinc-200" : "font-semibold text-zinc-800"
                        : item.level === 2
                          ? isDark ? "pl-4 text-zinc-400 font-medium" : "pl-4 text-zinc-600 font-medium"
                          : isDark ? "pl-6 text-zinc-500 text-[11px]" : "pl-6 text-zinc-500 text-[11px]"
                    } ${
                      activeTocId === item.id
                        ? isDark ? "text-blue-400 font-bold bg-blue-500/10" : "text-blue-600 font-bold bg-blue-50"
                        : isDark ? "hover:text-blue-400 hover:bg-white/5" : "hover:text-blue-600 hover:bg-zinc-100"
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>

              <div className={`pt-6 border-t ${isDark ? "border-[#222533]" : "border-[#E5E7EB]"}`}>
                <button
                  onClick={() => router.push(`/?prompt=${encodeURIComponent(`Give me a summary of ${currentDoc?.name}`)}`)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition ${
                    isDark
                      ? "bg-blue-600/15 text-blue-400 border-blue-500/30 hover:bg-blue-600/25"
                      : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 shadow-xs"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Summarize in AI Chat</span>
                </button>
              </div>
            </div>
          </aside>
        )}

      </div>

      {/* Sign Out Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl space-y-4 ${
            isDark ? "bg-[#181A20] border-[#2A2D35] text-white" : "bg-white border-[#E5E7EB] text-zinc-900"
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Sign Out</h3>
                  <p className="text-[11px] text-zinc-500">End your active session</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`p-1 rounded-lg ${isDark ? "hover:bg-white/10 text-zinc-400" : "hover:bg-zinc-100 text-zinc-600"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Are you sure you want to log out from <span className={`font-semibold ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>{currentUser?.email || currentUser?.displayName}</span>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  isDark ? "border-zinc-700 hover:bg-white/5 text-zinc-300" : "border-zinc-200 hover:bg-zinc-50 text-zinc-700"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl border text-xs font-semibold backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200 ${
          isDark
            ? 'bg-[#101815]/95 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
            : 'bg-white/95 text-emerald-900 border-emerald-200 shadow-xl shadow-emerald-900/10'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium tracking-tight">{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

export default function MarkdownViewerPage() {
  return (
    <Suspense fallback={<MarkdownViewerLoader subtitle="Preparing Hyyzo Documentation Engine..." />}>
      <MarkdownViewerInner />
    </Suspense>
  );
}
