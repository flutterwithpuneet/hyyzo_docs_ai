"""
Hyyzo Docs AI — Gemini Inspired Web Interface
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

# ---------------------------------------------------------
# 2. Gemini Design System (Material 3, Soft Pills, Floating Panels)
# ---------------------------------------------------------
is_dark = (st.session_state.theme == "dark")

# Gemini Palette Specs:
BG_COLOR = "#0F1115" if is_dark else "#FFFFFF"
SURFACE_SECONDARY = "#171A21" if is_dark else "#F8F9FA"
ELEVATED_CARD = "#20242D" if is_dark else "#F1F3F4"
TEXT_PRIMARY = "#E3E2E6" if is_dark else "#1F1F1F"
TEXT_SECONDARY = "#909094" if is_dark else "#5E5E5E"
ACCENT_BLUE = "#8AB4F8" if is_dark else "#1A73E8"
BORDER_COLOR = "#2C303B" if is_dark else "#E1E3E1"
USER_BUBBLE_BG = "#2B303B" if is_dark else "#E8F0FE"

CUSTOM_CSS = f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Inter:wght@400;500;600&display=swap');

    /* Global Gemini Styling */
    html, body, .stApp {{
        background-color: {BG_COLOR} !important;
        color: {TEXT_PRIMARY} !important;
        font-family: 'Google Sans', 'Inter', -apple-system, sans-serif !important;
        -webkit-font-smoothing: antialiased;
    }}

    .block-container {{
        padding-top: 1.5rem !important;
        padding-bottom: 5rem !important;
        max-width: 880px !important;
    }}

    /* Collapsible Sidebar - Gemini Style */
    [data-testid="stSidebar"] {{
        background-color: {SURFACE_SECONDARY} !important;
        border-right: 1px solid {BORDER_COLOR} !important;
    }}
    
    /* Top App Bar Header */
    .gemini-header {{
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 20px;
        margin-bottom: 28px;
        border-bottom: 1px solid {BORDER_COLOR};
    }}
    .gemini-logo-text {{
        font-size: 1.3rem;
        font-weight: 500;
        letter-spacing: -0.01em;
        display: flex;
        align-items: center;
        gap: 10px;
        color: {TEXT_PRIMARY};
    }}
    .gemini-sparkle {{
        background: linear-gradient(135deg, #4285F4, #9B51E0, #EA4335);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 1.5rem;
        font-weight: 700;
    }}

    /* Rounded Pill Buttons (Gemini Style) */
    .stButton>button {{
        border-radius: 24px !important;
        border: 1px solid {BORDER_COLOR} !important;
        background-color: {ELEVATED_CARD} !important;
        color: {TEXT_PRIMARY} !important;
        font-size: 0.88rem !important;
        font-weight: 500 !important;
        padding: 8px 18px !important;
        transition: all 0.2s cubic-bezier(0.2, 0, 0, 1) !important;
        box-shadow: none !important;
    }}
    .stButton>button:hover {{
        background-color: {BORDER_COLOR} !important;
        color: {ACCENT_BLUE} !important;
        transform: translateY(-1px);
    }}

    /* User Message Bubble */
    .user-msg-bubble {{
        background-color: {USER_BUBBLE_BG};
        color: {TEXT_PRIMARY};
        border-radius: 20px 20px 4px 20px;
        padding: 14px 18px;
        font-size: 0.95rem;
        line-height: 1.5;
        display: inline-block;
        max-width: 85%;
        margin-left: auto;
    }}

    /* Assistant Message (Borderless Clean Typography) */
    .ai-msg-container {{
        color: {TEXT_PRIMARY};
        font-size: 0.95rem;
        line-height: 1.6;
        padding: 6px 0px;
    }}

    /* Floating Gemini-style Input Composer */
    [data-testid="stChatInput"] {{
        border-radius: 28px !important;
        border: 1px solid {BORDER_COLOR} !important;
        background-color: {SURFACE_SECONDARY} !important;
        color: {TEXT_PRIMARY} !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
    }}
    [data-testid="stChatInput"]:focus-within {{
        border-color: {ACCENT_BLUE} !important;
    }}

    /* Source Cards Grid */
    .source-card {{
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background-color: {ELEVATED_CARD};
        border: 1px solid {BORDER_COLOR};
        color: {ACCENT_BLUE};
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 0.8rem;
        font-weight: 500;
        margin: 6px 6px 0 0;
    }}

    /* Quick Prompt Cards */
    .starter-card {{
        background-color: {SURFACE_SECONDARY};
        border: 1px solid {BORDER_COLOR};
        border-radius: 16px;
        padding: 16px;
        font-size: 0.88rem;
        color: {TEXT_PRIMARY};
        transition: border-color 0.2s ease;
    }}

    /* Hide standard Streamlit header & footer */
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
        with st.spinner("Initializing Gemini knowledge index..."):
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
# 5. Gemini-Inspired Sidebar
# ---------------------------------------------------------
with st.sidebar:
    st.markdown(
        """
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
            <span class="gemini-sparkle">✦</span>
            <span style="font-size: 1.15rem; font-weight: 500;">Hyyzo Docs AI</span>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # New Chat Pill Button
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
    st.markdown(f"<div style='font-size: 0.78rem; font-weight: 500; color: {TEXT_SECONDARY}; margin-bottom: 8px;'>RECENT CHATS</div>", unsafe_allow_html=True)

    # Chat Sessions List
    for cid, chat_data in list(st.session_state.chats.items()):
        col1, col2 = st.columns([0.84, 0.16])
        is_active = (cid == current_chat_id)
        btn_label = f"{'✦ ' if is_active else '💬 '}{chat_data['title']}"
        
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
    st.markdown(f"<div style='border-top: 1px solid {BORDER_COLOR}; margin: 16px 0;'></div>", unsafe_allow_html=True)
    
    # Theme & Index Controls
    st.markdown(f"<div style='font-size: 0.78rem; font-weight: 500; color: {TEXT_SECONDARY}; margin-bottom: 8px;'>SETTINGS</div>", unsafe_allow_html=True)
    
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
# 6. Gemini Top App Bar
# ---------------------------------------------------------
st.markdown(
    f"""
    <div class="gemini-header">
        <div class="gemini-logo-text">
            <span class="gemini-sparkle">✦</span> Hyyzo Docs AI
        </div>
        <div style="font-size: 0.85rem; color: {TEXT_SECONDARY}; font-weight: 500;">
            Grounded with <span style="color: {ACCENT_BLUE}; font-weight: 600;">Gemini 2.0 Flash</span>
        </div>
    </div>
    """,
    unsafe_allow_html=True
)

# ---------------------------------------------------------
# 7. Starter View (Empty Chat State)
# ---------------------------------------------------------
if not current_chat["messages"]:
    st.markdown(
        f"""
        <div style="margin-top: 1.5rem; margin-bottom: 2rem;">
            <h2 style="font-weight: 400; font-size: 2.2rem; letter-spacing: -0.02em;">
                <span class="gemini-sparkle">Hello,</span> Developer
            </h2>
            <p style="color: {TEXT_SECONDARY}; font-size: 1.05rem; margin-top: 6px;">
                How can I help you explore your Hyyzo codebase and documentation today?
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    p_cols = st.columns(3)
    prompts = [
        "Explain the Rewards Architecture in Hyyzo.",
        "How is Rewards Gamification implemented?",
        "What are the main rewards feature components?"
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
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(msg["content"])
    else:
        with st.chat_message("assistant", avatar="✦"):
            st.markdown(msg["content"])
            
            # Document Sources Pill Tags
            if "sources" in msg and msg["sources"]:
                st.markdown(f"<div style='margin-top: 14px; font-size: 0.78rem; color: {TEXT_SECONDARY}; font-weight: 500;'>DOCUMENT SOURCES</div>", unsafe_allow_html=True)
                sources_html = ""
                for s in msg["sources"]:
                    sources_html += f"""<span class="source-card">📄 {s['file']} <span style="opacity:0.6; margin-left:2px;">({s['score']})</span></span>"""
                st.markdown(sources_html, unsafe_allow_html=True)

# ---------------------------------------------------------
# 9. Chat Input & Response Processing
# ---------------------------------------------------------
user_input = st.chat_input("Ask anything about Hyyzo...")

if 'selected_prompt' in locals() and selected_prompt:
    user_input = selected_prompt

if user_input:
    if not current_chat["messages"]:
        current_chat["title"] = user_input[:26] + "..." if len(user_input) > 26 else user_input

    st.chat_message("user", avatar="👤").markdown(user_input)
    current_chat["messages"].append({"role": "user", "content": user_input})

    with st.chat_message("assistant", avatar="✦"):
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
                    st.markdown(f"<div style='margin-top: 14px; font-size: 0.78rem; color: {TEXT_SECONDARY}; font-weight: 500;'>DOCUMENT SOURCES</div>", unsafe_allow_html=True)
                    sources_html = ""
                    for s in sources:
                        sources_html += f"""<span class="source-card">📄 {s['file']} <span style="opacity:0.6; margin-left:2px;">({s['score']})</span></span>"""
                    st.markdown(sources_html, unsafe_allow_html=True)

                current_chat["messages"].append({
                    "role": "assistant",
                    "content": resp_text,
                    "sources": sources
                })
            except Exception as ex:
                st.error(f"Error generating answer: {ex}")


