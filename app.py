"""
Hyyzo Docs AI — Clean, Meaningful & Minimalist AI Assistant Interface
Run: py -m streamlit run app.py
"""

import uuid
import datetime
import streamlit as st

from src.config import DOCS_DIR
from src.loader import load_documents
from src.engine import setup_models, build_index, load_index, get_query_engine

# ---------------------------------------------------------
# 1. Page Config & Session State Initialization
# ---------------------------------------------------------
st.set_page_config(
    page_title="Hyyzo Docs AI",
    page_icon="✦",
    layout="wide",
    initial_sidebar_state="expanded"
)

if "theme" not in st.session_state:
    st.session_state.theme = "dark"

if "user_name" not in st.session_state:
    st.session_state.user_name = "Puneet"

# ---------------------------------------------------------
# 2. Minimalist & Clean Design System
# ---------------------------------------------------------
is_dark = (st.session_state.theme == "dark")

BG_COLOR = "#0D0F12" if is_dark else "#FAFAFA"
SURFACE_SIDEBAR = "#14171D" if is_dark else "#FFFFFF"
CARD_BG = "#1A1E26" if is_dark else "#F3F4F6"
TEXT_PRIMARY = "#F3F4F6" if is_dark else "#111827"
TEXT_MUTED = "#9CA3AF" if is_dark else "#6B7280"
BORDER_COLOR = "#242933" if is_dark else "#E5E7EB"
ACCENT_BLUE = "#3B82F6" if is_dark else "#2563EB"

CUSTOM_CSS = f"""
<style>
    /* Clean System-Native Font Stack */
    html, body, .stApp {{
        background-color: {BG_COLOR} !important;
        color: {TEXT_PRIMARY} !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 16px !important;
        line-height: 1.6 !important;
        -webkit-font-smoothing: antialiased;
    }}

    .block-container {{
        padding-top: 2rem !important;
        padding-bottom: 6rem !important;
        max-width: 840px !important;
    }}

    /* Sidebar Styling */
    [data-testid="stSidebar"] {{
        background-color: {SURFACE_SIDEBAR} !important;
        border-right: 1px solid {BORDER_COLOR} !important;
    }}

    /* Sidebar Brand Title */
    .app-brand {{
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 20px;
        color: {TEXT_PRIMARY};
    }}

    /* Minimalist Profile Card */
    .profile-card {{
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background-color: {CARD_BG};
        border: 1px solid {BORDER_COLOR};
        border-radius: 12px;
        margin-bottom: 16px;
    }}
    .user-avatar {{
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: linear-gradient(135deg, {ACCENT_BLUE}, #8B5CF6);
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.85rem;
    }}

    /* Sidebar Buttons */
    .stButton>button {{
        border-radius: 10px !important;
        border: 1px solid {BORDER_COLOR} !important;
        background-color: {CARD_BG} !important;
        color: {TEXT_PRIMARY} !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        padding: 8px 14px !important;
        transition: all 0.15s ease !important;
        box-shadow: none !important;
    }}
    .stButton>button:hover {{
        border-color: {ACCENT_BLUE} !important;
        color: {ACCENT_BLUE} !important;
    }}

    /* Ambient Background Gemini Aurora Glow */
    .stApp::before {{
        content: "";
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 650px;
        height: 450px;
        background: radial-gradient(
            ellipse 80% 60% at 50% 50%,
            rgba(59, 130, 246, 0.12) 0%,
            rgba(139, 92, 246, 0.08) 45%,
            transparent 75%
        );
        filter: blur(65px);
        pointer-events: none;
        z-index: 0;
        animation: geminiAmbientPulse 9s ease-in-out infinite alternate;
    }}

    @keyframes geminiAmbientPulse {{
        0% {{ transform: translate(-50%, -50%) scale(0.95); opacity: 0.7; }}
        100% {{ transform: translate(-50%, -50%) scale(1.1); opacity: 1; }}
    }}

    /* Clean Hero Section with Gemini Gradient Typography */
    .hero-title {{
        font-size: 2.4rem;
        font-weight: 600;
        letter-spacing: -0.025em;
        margin-top: 1.8rem;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #FFFFFF 20%, #93C5FD 65%, #C4B5FD 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: heroFloat 5s ease-in-out infinite alternate;
    }}

    @keyframes heroFloat {{
        0% {{ transform: translateY(0px); }}
        100% {{ transform: translateY(-3px); }}
    }}

    .hero-subtitle {{
        color: {TEXT_MUTED};
        font-size: 1.05rem;
        margin-bottom: 2rem;
    }}

    /* 3D Glassmorphic Quick Action Cards */
    .stButton>button {{
        border-radius: 14px !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        background: rgba(26, 30, 38, 0.7) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        color: {TEXT_PRIMARY} !important;
        font-size: 0.9rem !important;
        font-weight: 500 !important;
        padding: 10px 16px !important;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.03) inset !important;
    }}
    .stButton>button:hover {{
        border-color: rgba(96, 165, 250, 0.45) !important;
        color: #FFFFFF !important;
        background: rgba(36, 42, 54, 0.85) !important;
        transform: translateY(-2px) scale(1.01) !important;
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25), 0 0 0 1px rgba(96, 165, 250, 0.3) inset !important;
    }}

    /* Clean Source Tag Pills */
    .source-tag {{
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(30, 41, 59, 0.6);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(96, 165, 250, 0.2);
        color: #60A5FA;
        padding: 5px 12px;
        border-radius: 10px;
        font-size: 0.78rem;
        font-weight: 500;
        margin: 6px 6px 0 0;
        transition: all 0.2s ease;
    }}
    .source-tag:hover {{
        border-color: #60A5FA;
        background: rgba(37, 99, 235, 0.15);
    }}

    /* === SIGNATURE GEMINI 3D GLASSMORPHIC CHAT COMPOSER WITH LIQUID UNDERGLOW === */
    [data-testid="stChatInput"] {{
        position: relative !important;
        border-radius: 26px !important;
        border: 1px solid rgba(255, 255, 255, 0.12) !important;
        background: rgba(18, 21, 30, 0.75) !important;
        backdrop-filter: blur(28px) saturate(190%) !important;
        -webkit-backdrop-filter: blur(28px) saturate(190%) !important;
        color: {TEXT_PRIMARY} !important;
        box-shadow:
            0 0 35px 2px rgba(59, 130, 246, 0.28),
            0 14px 44px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.06) inset !important;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        animation: geminiComposerGlow 7.5s ease-in-out infinite alternate !important;
    }}

    @keyframes geminiComposerGlow {{
        0% {{
            box-shadow:
                0 0 28px 2px rgba(59, 130, 246, 0.22),
                0 12px 38px rgba(0, 0, 0, 0.55),
                0 0 0 1px rgba(255, 255, 255, 0.05) inset;
            transform: translateY(0px);
        }}
        50% {{
            box-shadow:
                0 0 45px 6px rgba(96, 165, 250, 0.36),
                0 16px 48px rgba(0, 0, 0, 0.7),
                0 0 0 1px rgba(255, 255, 255, 0.1) inset;
            transform: translateY(-2px);
        }}
        100% {{
            box-shadow:
                0 0 35px 3px rgba(139, 92, 246, 0.3),
                0 14px 42px rgba(0, 0, 0, 0.6),
                0 0 0 1px rgba(255, 255, 255, 0.07) inset;
            transform: translateY(1px);
        }}
    }}

    [data-testid="stChatInput"]:focus-within {{
        background: rgba(22, 26, 38, 0.9) !important;
        border-color: rgba(96, 165, 250, 0.6) !important;
        box-shadow:
            0 0 50px 8px rgba(59, 130, 246, 0.5),
            0 18px 52px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.15) inset !important;
        transform: translateY(-3px) scale(1.005) !important;
    }}

    /* Suppress all Streamlit default UI chrome, headers, toolbars, and loading ghosts */
    #MainMenu, footer, header, [data-testid="stHeader"], [data-testid="stToolbar"], [data-testid="stDecoration"], .stDeployButton, [data-testid="stStatusWidget"] {{
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
    }}
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------
# 3. RAG Engine Loading
# ---------------------------------------------------------
@st.cache_resource(show_spinner=False)
def initialize_query_engine():
    setup_models()
    index = load_index()
    if index is None:
        with st.spinner("Loading Hyyzo AI engine..."):
            documents = load_documents(DOCS_DIR)
            index = build_index(documents)
    return get_query_engine(index)

try:
    query_engine = initialize_query_engine()
except Exception as e:
    st.error(f"Engine setup failed: {e}")
    st.stop()

# ---------------------------------------------------------
# 4. Session State Management
# ---------------------------------------------------------
if "chats" not in st.session_state:
    default_id = str(uuid.uuid4())[:8]
    st.session_state.chats = {
        default_id: {
            "title": "New Chat",
            "created_at": datetime.datetime.now().strftime("%b %d, %H:%M"),
            "messages": []
        }
    }
    st.session_state.current_chat_id = default_id

if st.session_state.current_chat_id not in st.session_state.chats:
    st.session_state.current_chat_id = list(st.session_state.chats.keys())[0]

current_chat_id = st.session_state.current_chat_id
current_chat = st.session_state.chats[current_chat_id]

# ---------------------------------------------------------
# 5. Clean & Meaningful Sidebar
# ---------------------------------------------------------
with st.sidebar:
    st.markdown(
        """
        <div class="app-brand">
            <span style="color: #3B82F6;">✦</span> Hyyzo Docs AI
        </div>
        """,
        unsafe_allow_html=True
    )

    # User Profile Header
    initials = st.session_state.user_name[:2].upper() if st.session_state.user_name else "PN"
    st.markdown(
        f"""
        <div class="profile-card">
            <div class="user-avatar">{initials}</div>
            <div>
                <div style="font-size: 0.9rem; font-weight: 600;">{st.session_state.user_name}</div>
                <div style="font-size: 0.72rem; color: {TEXT_MUTED};">Documentation Assistant</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    with st.expander("👤 Settings & Name", expanded=False):
        new_name = st.text_input("Your Name", value=st.session_state.user_name)
        if new_name != st.session_state.user_name:
            st.session_state.user_name = new_name
            st.rerun()

    # New Chat Button
    if st.button("＋ New Chat", use_container_width=True):
        new_id = str(uuid.uuid4())[:8]
        st.session_state.chats[new_id] = {
            "title": "New Chat",
            "created_at": datetime.datetime.now().strftime("%b %d, %H:%M"),
            "messages": []
        }
        st.session_state.current_chat_id = new_id
        st.rerun()

    st.write("")
    st.markdown(f"<div style='font-size: 0.75rem; font-weight: 600; color: {TEXT_MUTED}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;'>Chat History</div>", unsafe_allow_html=True)

    # Chat Sessions List
    for cid, chat_data in list(st.session_state.chats.items()):
        is_active = (cid == current_chat_id)
        title_text = chat_data["title"]
        if len(title_text) > 22:
            title_text = title_text[:20] + "..."

        col1, col2 = st.columns([0.82, 0.18])
        with col1:
            icon = "✦ " if is_active else "💬 "
            if st.button(f"{icon}{title_text}", key=f"chat_{cid}", use_container_width=True):
                st.session_state.current_chat_id = cid
                st.rerun()
        with col2:
            if len(st.session_state.chats) > 1:
                if st.button("×", key=f"del_{cid}"):
                    del st.session_state.chats[cid]
                    if st.session_state.current_chat_id == cid:
                        st.session_state.current_chat_id = list(st.session_state.chats.keys())[0]
                    st.rerun()

    st.write("")
    st.markdown(f"<div style='border-top: 1px solid {BORDER_COLOR}; margin: 16px 0;'></div>", unsafe_allow_html=True)

    theme_label = "☀️ Light Theme" if is_dark else "🌙 Dark Theme"
    if st.button(theme_label, use_container_width=True):
        st.session_state.theme = "light" if is_dark else "dark"
        st.rerun()

    if st.button("🔄 Re-index Knowledge", use_container_width=True):
        with st.spinner("Embedding documents with Gemini AI..."):
            try:
                documents = load_documents(DOCS_DIR)
                index = build_index(documents)
                st.cache_resource.clear()
                st.toast("✅ Knowledge base re-indexed successfully!", icon="✦")
                st.rerun()
            except Exception as re_err:
                if "ResourceExhausted" in str(re_err) or "429" in str(re_err) or "Quota" in str(re_err):
                    st.error("⏳ **Gemini Rate Limit (429)**: The API quota was temporarily reached. Please wait ~30s before re-indexing, or continue chatting using your existing cached index.")
                else:
                    st.error(f"Re-indexing error: {re_err}")

# ---------------------------------------------------------
# 6. Hero View (Empty Chat State)
# ---------------------------------------------------------
if not current_chat["messages"]:
    st.markdown(
        f"""
        <div>
            <div class="hero-title">Hello, {st.session_state.user_name}</div>
            <div class="hero-subtitle">Ask questions about your Hyyzo codebase and documentation.</div>
        </div>
        """,
        unsafe_allow_html=True
    )

    prompts = [
        "Explain the Rewards Architecture in Hyyzo.",
        "How is Rewards Gamification implemented?",
        "What are the main rewards feature components?"
    ]
    p_cols = st.columns(3)
    selected_prompt = None
    for idx, pr in enumerate(prompts):
        with p_cols[idx]:
            if st.button(pr, key=f"quick_prompt_{idx}", use_container_width=True):
                selected_prompt = pr

# ---------------------------------------------------------
# 7. Conversation Messages
# ---------------------------------------------------------
for msg in current_chat["messages"]:
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(msg["content"])
    else:
        with st.chat_message("assistant", avatar="🤖"):
            st.markdown(msg["content"])
            if "sources" in msg and msg["sources"]:
                st.markdown(f"<div style='margin-top: 12px; font-size: 0.78rem; color: {TEXT_MUTED}; font-weight: 500;'>DOCUMENTS REFERENCED</div>", unsafe_allow_html=True)
                sources_html = ""
                for s in msg["sources"]:
                    sources_html += f"""<span class="source-tag">📄 {s['file']} ({s['score']})</span>"""
                st.markdown(sources_html, unsafe_allow_html=True)

# ---------------------------------------------------------
# 8. Interactive Chat Composer
# ---------------------------------------------------------
user_input = st.chat_input("Ask a question about Hyyzo...")

if 'selected_prompt' in locals() and selected_prompt:
    user_input = selected_prompt

if user_input:
    if not current_chat["messages"]:
        current_chat["title"] = user_input[:26] + "..." if len(user_input) > 26 else user_input

    st.chat_message("user", avatar="👤").markdown(user_input)
    current_chat["messages"].append({"role": "user", "content": user_input})

    with st.chat_message("assistant", avatar="🤖"):
        with st.spinner(""):
            try:
                response = query_engine.query(user_input)
                resp_text = str(response)
                st.markdown(resp_text)

                sources = []
                if hasattr(response, "source_nodes") and response.source_nodes:
                    sources = [
                        {
                            "file": n.metadata.get("file_name", "unknown"),
                            "score": f"{n.score:.2f}" if n.score is not None else "N/A"
                        }
                        for n in response.source_nodes
                    ]
                    st.markdown(f"<div style='margin-top: 12px; font-size: 0.78rem; color: {TEXT_MUTED}; font-weight: 500;'>DOCUMENTS REFERENCED</div>", unsafe_allow_html=True)
                    sources_html = ""
                    for s in sources:
                        sources_html += f"""<span class="source-tag">📄 {s['file']} ({s['score']})</span>"""
                    st.markdown(sources_html, unsafe_allow_html=True)

                current_chat["messages"].append({
                    "role": "assistant",
                    "content": resp_text,
                    "sources": sources
                })
            except Exception as ex:
                st.error(f"Error generating response: {ex}")
