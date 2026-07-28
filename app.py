"""
Hyyzo Docs AI — Swiss Minimalist AI Interface
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
    page_icon="⌘",
    layout="wide",
    initial_sidebar_state="expanded"
)

if "theme" not in st.session_state:
    st.session_state.theme = "dark"  # Default to Dark Mode (#0B0F19)

# ---------------------------------------------------------
# 2. Swiss Design System (Inter Font, Minimal, Flat, Crisp)
# ---------------------------------------------------------
is_dark = (st.session_state.theme == "dark")

BG_COLOR = "#0B0F19" if is_dark else "#FFFFFF"
PANEL_BG = "#111827" if is_dark else "#F9FAFB"
TEXT_PRIMARY = "#F9FAFB" if is_dark else "#111827"
TEXT_SECONDARY = "#9CA3AF" if is_dark else "#6B7280"
BORDER_COLOR = "#1F2937" if is_dark else "#E5E7EB"
CARD_BG = "#161E2E" if is_dark else "#F3F4F6"
ACCENT_COLOR = "#2563EB"

CUSTOM_CSS = f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* Global App Container */
    html, body, .stApp {{
        background-color: {BG_COLOR} !important;
        color: {TEXT_PRIMARY} !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        -webkit-font-smoothing: antialiased;
    }}

    /* Remove default Streamlit top header padding */
    .block-container {{
        padding-top: 2rem !important;
        padding-bottom: 3rem !important;
        max-width: 900px !important;
    }}

    /* Sidebar Styling */
    [data-testid="stSidebar"] {{
        background-color: {PANEL_BG} !important;
        border-right: 1px solid {BORDER_COLOR} !important;
    }}
    [data-testid="stSidebar"] * {{
        font-family: 'Inter', sans-serif !important;
    }}

    /* Minimalist Header */
    .top-header {{
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 16px;
        margin-bottom: 24px;
        border-bottom: 1px solid {BORDER_COLOR};
    }}
    .brand-title {{
        font-size: 1.15rem;
        font-weight: 600;
        color: {TEXT_PRIMARY};
        letter-spacing: -0.02em;
        display: flex;
        align-items: center;
        gap: 8px;
    }}
    .brand-subtitle {{
        font-size: 0.85rem;
        color: {TEXT_SECONDARY};
        margin-top: 2px;
    }}

    /* Minimal Flat Buttons */
    .stButton>button {{
        border-radius: 6px !important;
        border: 1px solid {BORDER_COLOR} !important;
        background-color: {CARD_BG} !important;
        color: {TEXT_PRIMARY} !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        padding: 6px 12px !important;
        transition: background-color 0.15s ease, border-color 0.15s ease !important;
        box-shadow: none !important;
    }}
    .stButton>button:hover {{
        background-color: {BORDER_COLOR} !important;
        border-color: {TEXT_SECONDARY} !important;
        color: {TEXT_PRIMARY} !important;
    }}

    /* Chat Messages */
    [data-testid="stChatMessage"] {{
        background-color: transparent !important;
        border: none !important;
        border-bottom: 1px solid {BORDER_COLOR} !important;
        padding: 18px 0px !important;
        border-radius: 0px !important;
    }}
    
    /* Input Container */
    [data-testid="stChatInput"] {{
        border-radius: 8px !important;
        border: 1px solid {BORDER_COLOR} !important;
        background-color: {PANEL_BG} !important;
        color: {TEXT_PRIMARY} !important;
    }}
    [data-testid="stChatInput"]:focus-within {{
        border-color: {ACCENT_COLOR} !important;
    }}

    /* Flat Sources Chips */
    .source-chip {{
        display: inline-flex;
        align-items: center;
        background-color: {CARD_BG};
        border: 1px solid {BORDER_COLOR};
        color: {TEXT_SECONDARY};
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
        margin: 4px 6px 4px 0;
        text-decoration: none;
    }}

    /* Quick Prompt Cards */
    .prompt-card {{
        border: 1px solid {BORDER_COLOR};
        background-color: {PANEL_BG};
        padding: 14px 16px;
        border-radius: 8px;
        font-size: 0.875rem;
        color: {TEXT_PRIMARY};
        cursor: pointer;
        transition: border-color 0.15s ease;
    }}
    .prompt-card:hover {{
        border-color: {ACCENT_COLOR};
    }}
    
    /* Code Blocks Clean Border */
    pre, code {{
        font-family: "JetBrains Mono", "SF Mono", Consolas, monospace !important;
        border-radius: 6px !important;
    }}

    /* Hide standard Streamlit header & footer clutter */
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
        with st.spinner("Indexing documentation..."):
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
            "title": "New Conversation",
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
# 5. Swiss Minimal Sidebar
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### ⌘ Hyyzo Docs AI")
    st.markdown(f"<span style='color: {TEXT_SECONDARY}; font-size: 0.8rem;'>Minimal RAG Assistant</span>", unsafe_allow_html=True)
    st.write("")

    # New Chat
    if st.button("＋ New Chat", use_container_width=True):
        new_id = str(uuid.uuid4())[:8]
        st.session_state.chats[new_id] = {
            "title": "New Conversation",
            "created_at": datetime.datetime.now().strftime("%b %d, %H:%M"),
            "messages": []
        }
        st.session_state.current_chat_id = new_id
        st.rerun()

    st.write("")
    st.markdown(f"<span style='font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: {TEXT_SECONDARY};'>Chat History</span>", unsafe_allow_html=True)
    st.write("")

    # Chat Sessions List
    for cid, chat_data in list(st.session_state.chats.items()):
        col1, col2 = st.columns([0.84, 0.16])
        is_active = (cid == current_chat_id)
        btn_label = f"{'• ' if is_active else ''}{chat_data['title']}"
        
        with col1:
            if st.button(btn_label, key=f"chat_nav_{cid}", use_container_width=True):
                st.session_state.current_chat_id = cid
                st.rerun()
        
        with col2:
            if len(st.session_state.chats) > 1:
                if st.button("×", key=f"chat_del_{cid}"):
                    del st.session_state.chats[cid]
                    if st.session_state.current_chat_id == cid:
                        st.session_state.current_chat_id = list(st.session_state.chats.keys())[0]
                    st.rerun()

    st.write("")
    st.markdown(f"<div style='border-top: 1px solid {BORDER_COLOR}; margin: 12px 0;'></div>", unsafe_allow_html=True)
    
    # Settings & Theme Toggle
    st.markdown(f"<span style='font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: {TEXT_SECONDARY};'>Settings</span>", unsafe_allow_html=True)
    st.write("")
    
    theme_label = "☀️ Light Mode" if is_dark else "🌙 Dark Mode"
    if st.button(theme_label, use_container_width=True):
        st.session_state.theme = "light" if is_dark else "dark"
        st.rerun()

    if st.button("🔄 Re-index Docs", use_container_width=True):
        with st.spinner("Re-indexing documents..."):
            documents = load_documents(DOCS_DIR)
            index = build_index(documents)
            st.cache_resource.clear()
            st.rerun()

# ---------------------------------------------------------
# 6. Main Top Navigation Header
# ---------------------------------------------------------
st.markdown(
    f"""
    <div class="top-header">
        <div>
            <div class="brand-title">Hyyzo Docs AI</div>
            <div class="brand-subtitle">Grounded knowledge retrieval from technical documentation</div>
        </div>
        <div style="font-size: 0.8rem; color: {TEXT_SECONDARY}; font-weight: 500;">
            Model: <span style="color: {TEXT_PRIMARY}; font-weight: 600;">Gemini 2.0 Flash</span>
        </div>
    </div>
    """,
    unsafe_allow_html=True
)

# ---------------------------------------------------------
# 7. Starter View (Empty Chat State)
# ---------------------------------------------------------
if not current_chat["messages"]:
    st.markdown(f"<div style='margin-top: 2rem; margin-bottom: 1.5rem;'><h3 style='font-weight: 600; letter-spacing: -0.02em;'>How can I help you today?</h3><p style='color: {TEXT_SECONDARY}; font-size: 0.9rem;'>Ask questions about system architecture, API endpoints, or gamification logic.</p></div>", unsafe_allow_html=True)
    
    p_cols = st.columns(3)
    prompts = [
        "What is the Rewards Architecture in Hyyzo?",
        "Explain how Rewards Gamification works.",
        "List the key components in rewards module."
    ]
    selected_prompt = None
    for idx, pr in enumerate(prompts):
        with p_cols[idx]:
            if st.button(pr, key=f"quick_pr_{idx}", use_container_width=True):
                selected_prompt = pr

# ---------------------------------------------------------
# 8. Render Conversation History
# ---------------------------------------------------------
for msg in current_chat["messages"]:
    avatar_icon = "👤" if msg["role"] == "user" else "⌘"
    with st.chat_message(msg["role"], avatar=avatar_icon):
        st.markdown(msg["content"])
        
        # Sources Render (Flat & Minimal)
        if "sources" in msg and msg["sources"]:
            st.markdown(f"<div style='margin-top: 10px; font-size: 0.75rem; color: {TEXT_SECONDARY}; font-weight: 600;'>SOURCES</div>", unsafe_allow_html=True)
            sources_html = ""
            for s in msg["sources"]:
                sources_html += f"""<span class="source-chip">📄 {s['file']} <span style="opacity:0.6; margin-left:4px;">({s['score']})</span></span>"""
            st.markdown(sources_html, unsafe_allow_html=True)

# ---------------------------------------------------------
# 9. Chat Input & Processing
# ---------------------------------------------------------
user_input = st.chat_input("Ask anything about Hyyzo...")

if 'selected_prompt' in locals() and selected_prompt:
    user_input = selected_prompt

if user_input:
    if not current_chat["messages"]:
        current_chat["title"] = user_input[:28] + "..." if len(user_input) > 28 else user_input

    st.chat_message("user", avatar="👤").markdown(user_input)
    current_chat["messages"].append({"role": "user", "content": user_input})

    with st.chat_message("assistant", avatar="⌘"):
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
                    st.markdown(f"<div style='margin-top: 10px; font-size: 0.75rem; color: {TEXT_SECONDARY}; font-weight: 600;'>SOURCES</div>", unsafe_allow_html=True)
                    sources_html = ""
                    for s in sources:
                        sources_html += f"""<span class="source-chip">📄 {s['file']} <span style="opacity:0.6; margin-left:4px;">({s['score']})</span></span>"""
                    st.markdown(sources_html, unsafe_allow_html=True)

                current_chat["messages"].append({
                    "role": "assistant",
                    "content": resp_text,
                    "sources": sources
                })
            except Exception as ex:
                st.error(f"Error: {ex}")


