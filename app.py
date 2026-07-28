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

    /* Clean Hero Section */
    .hero-title {{
        font-size: 2.2rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        margin-top: 1.5rem;
        margin-bottom: 0.5rem;
        color: {TEXT_PRIMARY};
    }}
    .hero-subtitle {{
        color: {TEXT_MUTED};
        font-size: 1.05rem;
        margin-bottom: 2rem;
    }}

    /* Clean Source Tag Pills */
    .source-tag {{
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: {CARD_BG};
        border: 1px solid {BORDER_COLOR};
        color: {ACCENT_BLUE};
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 500;
        margin: 6px 6px 0 0;
    }}

    /* Floating Chat Composer */
    [data-testid="stChatInput"] {{
        border-radius: 16px !important;
        border: 1px solid {BORDER_COLOR} !important;
        background-color: {SURFACE_SIDEBAR} !important;
        color: {TEXT_PRIMARY} !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
    }}

    #MainMenu, footer, header {{
        visibility: hidden;
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
        with st.spinner("Updating index..."):
            documents = load_documents(DOCS_DIR)
            index = build_index(documents)
            st.cache_resource.clear()
            st.rerun()

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
