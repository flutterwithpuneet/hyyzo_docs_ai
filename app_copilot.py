"""
Hyyzo Docs AI — Microsoft Copilot Exact Replica (Custom Web App)
Run: py -m streamlit run app_copilot.py
"""

import uuid
import datetime
import streamlit as st

from src.config import DOCS_DIR
from src.loader import load_documents
from src.engine import setup_models, build_index, load_index, get_query_engine

# ---------------------------------------------------------
# 1. Page Configuration
# ---------------------------------------------------------
st.set_page_config(
    page_title="Copilot",
    page_icon="🌊",
    layout="wide",
    initial_sidebar_state="expanded"
)

if "theme" not in st.session_state:
    st.session_state.theme = "dark"

if "user_name" not in st.session_state:
    st.session_state.user_name = "Puneet"

# ---------------------------------------------------------
# 2. Exact Copilot Dark Theme CSS Injection
# ---------------------------------------------------------
BG_MAIN = "#0F121C"
BG_SIDEBAR = "#090B13"
CARD_PILL_BG = "#161B26"
HOVER_BG = "#1E2433"
TEXT_WHITE = "#FFFFFF"
TEXT_MUTED = "#8E96A4"
ACCENT_BLUE = "#2563EB"
BORDER_DARK = "#1C2130"

EXACT_COPILOT_CSS = f"""
<style>
    /* Global Reset & Microsoft System Font Stack */
    html, body, .stApp {{
        background-color: {BG_MAIN} !important;
        color: {TEXT_WHITE} !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 15px !important;
    }}

    .block-container {{
        padding-top: 1.5rem !important;
        padding-bottom: 6rem !important;
        max-width: 860px !important;
    }}

    /* Exact Sidebar Styling */
    [data-testid="stSidebar"] {{
        background-color: {BG_SIDEBAR} !important;
        border-right: 1px solid {BORDER_DARK} !important;
        padding-top: 1rem !important;
    }}

    /* Top Sidebar Branding Header */
    .copilot-brand-header {{
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 6px 12px 18px 12px;
        color: {TEXT_WHITE};
        font-size: 1.25rem;
        font-weight: 600;
        letter-spacing: -0.01em;
    }}

    /* Navigation Item Pills (Exact Copilot Style) */
    .stButton>button {{
        border-radius: 20px !important;
        border: 1px solid transparent !important;
        background-color: transparent !important;
        color: {TEXT_WHITE} !important;
        font-size: 0.95rem !important;
        font-weight: 500 !important;
        padding: 10px 16px !important;
        text-align: left !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        transition: all 0.15s ease !important;
        box-shadow: none !important;
    }}
    .stButton>button:hover {{
        background-color: {HOVER_BG} !important;
        color: {TEXT_WHITE} !important;
    }}

    /* Pill Badges (e.g. PREVIEW) */
    .preview-badge {{
        background-color: #262D3D;
        color: #A3B3D1;
        font-size: 0.65rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.5px;
        margin-left: 6px;
    }}

    /* Projects Collapsible Item */
    .projects-pill {{
        background-color: {CARD_PILL_BG} !important;
        border: 1px solid {BORDER_DARK} !important;
        border-radius: 14px !important;
    }}

    /* Sidebar Footer User Card */
    .copilot-user-footer {{
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        margin-top: 2rem;
        border-top: 1px solid {BORDER_DARK};
    }}
    .copilot-avatar-img {{
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0078D4, #7F56D9);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        color: #FFF;
        font-size: 0.88rem;
    }}
    .upgrade-btn {{
        background-color: transparent;
        border: 1px solid #333C4E;
        color: #FFFFFF;
        padding: 6px 16px;
        border-radius: 18px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
    }}

    /* Main Hero Greeting Title */
    .copilot-hero-header {{
        text-align: center;
        font-size: 2.2rem;
        font-weight: 600;
        color: {TEXT_WHITE};
        margin-top: 3.5rem;
        margin-bottom: 2rem;
        letter-spacing: -0.02em;
    }}

    /* Floating Input Box Composer */
    [data-testid="stChatInput"] {{
        border-radius: 24px !important;
        border: 1px solid {BORDER_DARK} !important;
        background-color: {CARD_PILL_BG} !important;
        color: {TEXT_WHITE} !important;
        box-shadow: 0 12px 40px rgba(0,0,0,0.35) !important;
    }}
    [data-testid="stChatInput"]:focus-within {{
        border-color: {ACCENT_BLUE} !important;
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
st.markdown(EXACT_COPILOT_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------
# 3. RAG Engine Setup
# ---------------------------------------------------------
@st.cache_resource(show_spinner=False)
def initialize_query_engine():
    setup_models()
    index = load_index()
    if index is None:
        with st.spinner("Initializing Copilot RAG index..."):
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
            "title": "New conversation",
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
# 5. 100% Exact Microsoft Copilot Sidebar Replica
# ---------------------------------------------------------
with st.sidebar:
    # Header: Copilot Title & Layout Toggle Icon
    st.markdown(
        """
        <div class="copilot-brand-header">
            <span>Copilot</span>
            <span style="font-size: 1.1rem; opacity: 0.8; cursor: pointer;">🎛️</span>
        </div>
        """,
        unsafe_allow_html=True
    )

    # 1. New Chat (Bordered Pill Button)
    if st.button("📝  New chat", key="copilot_new_chat_btn", use_container_width=True):
        new_id = str(uuid.uuid4())[:8]
        st.session_state.chats[new_id] = {
            "title": "New conversation",
            "created_at": datetime.datetime.now().strftime("%b %d, %H:%M"),
            "messages": []
        }
        st.session_state.current_chat_id = new_id
        st.rerun()

    # 2. Top Navigation Links
    st.button("📚  Library", key="nav_library", use_container_width=True)
    st.markdown(
        """
        <div style="display:flex; align-items:center; padding: 2px 0;">
            <span style="font-size: 0.95rem; margin-left: 12px; margin-right: 8px;">☑️</span>
            <span style="font-size: 0.95rem; font-weight: 500;">Tasks</span>
            <span class="preview-badge">PREVIEW</span>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # 3. Projects Collapsible Pill Dropdown
    st.markdown(
        f"""
        <div style="display:flex; align-items:center; justify-content:space-between; background-color:{CARD_PILL_BG}; border: 1px solid {BORDER_DARK}; border-radius: 16px; padding: 10px 14px; margin: 10px 0;">
            <div style="display:flex; align-items:center; gap: 10px;">
                <span>∨</span>
                <span style="font-size: 0.95rem; font-weight: 500;">Projects</span>
            </div>
            <span style="font-size: 1.1rem; cursor: pointer;">⊕</span>
        </div>
        """,
        unsafe_allow_html=True
    )

    st.markdown(f"<div style='border-top: 1px solid {BORDER_DARK}; margin: 14px 0;'></div>", unsafe_allow_html=True)

    # 4. Secondary Navigation
    st.button("🧭  Discover", key="nav_discover", use_container_width=True)
    st.button("🖼️  Imagine", key="nav_imagine", use_container_width=True)
    st.button("🎛️  Experiments", key="nav_experiments", use_container_width=True)

    st.markdown(f"<div style='border-top: 1px solid {BORDER_DARK}; margin: 14px 0;'></div>", unsafe_allow_html=True)

    # 5. History List (Recent Chats)
    for cid, chat_data in list(st.session_state.chats.items()):
        is_active = (cid == current_chat_id)
        title_text = chat_data["title"]
        if len(title_text) > 24:
            title_text = title_text[:22] + "..."

        col1, col2 = st.columns([0.84, 0.16])
        with col1:
            if st.button(f"{'💬 ' if not is_active else '✦ '}{title_text}", key=f"hist_{cid}", use_container_width=True):
                st.session_state.current_chat_id = cid
                st.rerun()
        with col2:
            if len(st.session_state.chats) > 1:
                if st.button("•••", key=f"del_{cid}"):
                    del st.session_state.chats[cid]
                    if st.session_state.current_chat_id == cid:
                        st.session_state.current_chat_id = list(st.session_state.chats.keys())[0]
                    st.rerun()

    # 6. Bottom User Footer Card (Exact Replica)
    st.markdown(
        f"""
        <div class="copilot-user-footer">
            <div style="display:flex; align-items:center; gap: 10px;">
                <div class="copilot-avatar-img">P</div>
                <div>
                    <div style="font-size: 0.9rem; font-weight: 600;">{st.session_state.user_name}</div>
                    <div style="font-size: 0.72rem; color: {TEXT_MUTED};">Free Plan</div>
                </div>
            </div>
            <button class="upgrade-btn">Upgrade</button>
        </div>
        """,
        unsafe_allow_html=True
    )

# ---------------------------------------------------------
# 6. Main Hero Chat View
# ---------------------------------------------------------
if not current_chat["messages"]:
    st.markdown(
        f"""
        <div class="copilot-hero-header">
            Hi {st.session_state.user_name}, what should we dive into today?
        </div>
        """,
        unsafe_allow_html=True
    )

    prompts = [
        "Create an image",
        "Predict the future",
        "Improve writing",
        "Take a quiz",
        "Design a logo",
        "Say it with care",
        "Make a meme",
        "Simplify a topic"
    ]

    p_cols = st.columns(4)
    selected_prompt = None
    for idx, pr in enumerate(prompts):
        with p_cols[idx % 4]:
            if st.button(pr, key=f"quick_pr_{idx}", use_container_width=True):
                selected_prompt = pr

# ---------------------------------------------------------
# 7. Chat History & Input
# ---------------------------------------------------------
for msg in current_chat["messages"]:
    if msg["role"] == "user":
        with st.chat_message("user", avatar="👤"):
            st.markdown(msg["content"])
    else:
        with st.chat_message("assistant", avatar="🌊"):
            st.markdown(msg["content"])

user_input = st.chat_input("Message Copilot")

if 'selected_prompt' in locals() and selected_prompt:
    user_input = selected_prompt

if user_input:
    if not current_chat["messages"]:
        current_chat["title"] = user_input[:26] + "..." if len(user_input) > 26 else user_input

    st.chat_message("user", avatar="👤").markdown(user_input)
    current_chat["messages"].append({"role": "user", "content": user_input})

    with st.chat_message("assistant", avatar="🌊"):
        with st.spinner("Copilot is responding..."):
            try:
                response = query_engine.query(user_input)
                resp_text = str(response)
                st.markdown(resp_text)

                current_chat["messages"].append({
                    "role": "assistant",
                    "content": resp_text
                })
            except Exception as ex:
                st.error(f"Error generating answer: {ex}")
