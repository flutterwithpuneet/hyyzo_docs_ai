"""
Hyyzo Docs AI — Premium Streamlit Web Interface
Run: py -m streamlit run app.py
"""

import uuid
import datetime
import streamlit as st

from src.config import DOCS_DIR
from src.loader import load_documents
from src.engine import setup_models, build_index, load_index, get_query_engine

# ---------------------------------------------------------
# 1. Page Configuration & Custom CSS (Glassmorphism & Theme)
# ---------------------------------------------------------
st.set_page_config(
    page_title="Hyyzo Docs AI",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

CUSTOM_CSS = """
<style>
    /* Global Container Padding & Colors */
    .stApp {
        background: linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0f172a 100%);
        color: #e6edf3;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* Sidebar Styling */
    [data-testid="stSidebar"] {
        background-color: rgba(22, 27, 34, 0.85) !important;
        backdrop-filter: blur(12px);
        border-right: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    /* Header Gradient Banner */
    .header-box {
        background: linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%);
        border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 16px;
        padding: 20px 24px;
        margin-bottom: 24px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
    }
    .header-title {
        font-size: 1.8rem;
        font-weight: 800;
        background: linear-gradient(90deg, #818cf8, #c084fc);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
    }
    .header-subtitle {
        color: #94a3b8;
        font-size: 0.95rem;
        margin-top: 4px;
    }

    /* Glassmorphism Stat Cards */
    .glass-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 12px 16px;
        margin-bottom: 12px;
        box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
    }

    /* Streamlit Buttons styling */
    .stButton>button {
        border-radius: 10px !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        background: rgba(30, 41, 59, 0.7) !important;
        color: #e2e8f0 !important;
        transition: all 0.2s ease-in-out !important;
    }
    .stButton>button:hover {
        background: linear-gradient(90deg, #6366f1, #a855f7) !important;
        color: #ffffff !important;
        border-color: transparent !important;
        box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3) !important;
        transform: translateY(-1px);
    }

    /* Source Pills */
    .source-chip {
        display: inline-flex;
        align-items: center;
        background: rgba(99, 102, 241, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.3);
        color: #a5b4fc;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.82rem;
        margin: 4px 4px 4px 0;
    }

    /* Chat message container styling */
    [data-testid="stChatMessage"] {
        background-color: rgba(30, 41, 59, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        border-radius: 12px !important;
        padding: 12px 16px !important;
        margin-bottom: 12px !important;
    }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ---------------------------------------------------------
# 2. RAG Engine Initialization
# ---------------------------------------------------------
@st.cache_resource(show_spinner=False)
def initialize_query_engine():
    """Setup models and load/build vector index once."""
    setup_models()
    index = load_index()
    if index is None:
        with st.spinner("⚡ Building vector index from documents..."):
            documents = load_documents(DOCS_DIR)
            index = build_index(documents)
    return get_query_engine(index)

try:
    query_engine = initialize_query_engine()
except Exception as e:
    st.error(f"Failed to initialize AI engine: {e}")
    st.stop()

# ---------------------------------------------------------
# 3. Session State & Sidebar Chat History Management
# ---------------------------------------------------------
if "chats" not in st.session_state:
    # Key: chat_id, Value: {"title": str, "messages": list}
    default_id = str(uuid.uuid4())[:8]
    st.session_state.chats = {
        default_id: {
            "title": "New Chat",
            "created_at": datetime.datetime.now().strftime("%I:%M %p"),
            "messages": []
        }
    }
    st.session_state.current_chat_id = default_id

if st.session_state.current_chat_id not in st.session_state.chats:
    st.session_state.current_chat_id = list(st.session_state.chats.keys())[0]

current_chat_id = st.session_state.current_chat_id
current_chat = st.session_state.chats[current_chat_id]

# ---------------------------------------------------------
# 4. Sidebar UI
# ---------------------------------------------------------
with st.sidebar:
    st.markdown("### ⚡ Hyyzo Docs AI")
    st.caption("AI Assistant Grounded in Hyyzo Knowledge Base")
    
    # New Chat Button
    if st.button("➕ New Chat", use_container_width=True):
        new_id = str(uuid.uuid4())[:8]
        st.session_state.chats[new_id] = {
            "title": "New Chat",
            "created_at": datetime.datetime.now().strftime("%I:%M %p"),
            "messages": []
        }
        st.session_state.current_chat_id = new_id
        st.rerun()

    st.markdown("---")
    st.markdown("#### 💬 Chat History")

    # Render History List
    for cid, chat_data in list(st.session_state.chats.items()):
        col1, col2 = st.columns([0.82, 0.18])
        is_active = (cid == current_chat_id)
        btn_label = f"{'🟢 ' if is_active else '💬 '}{chat_data['title']}"
        
        with col1:
            if st.button(btn_label, key=f"select_{cid}", use_container_width=True):
                st.session_state.current_chat_id = cid
                st.rerun()
        
        with col2:
            if len(st.session_state.chats) > 1:
                if st.button("🗑️", key=f"del_{cid}"):
                    del st.session_state.chats[cid]
                    if st.session_state.current_chat_id == cid:
                        st.session_state.current_chat_id = list(st.session_state.chats.keys())[0]
                    st.rerun()

    st.markdown("---")
    st.markdown("#### ⚙️ Actions & Info")
    
    if st.button("🔄 Re-index Documents", use_container_width=True):
        with st.spinner("Rebuilding knowledge index..."):
            documents = load_documents(DOCS_DIR)
            index = build_index(documents)
            st.cache_resource.clear()
            st.success("Index updated successfully!")
            st.rerun()

    st.markdown(
        """
        <div class="glass-card" style="margin-top: 15px;">
            <div style="font-size: 0.8rem; color: #94a3b8;">System Status</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: #10b981;">● Engine Ready</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Model: Gemini 1.5 Flash</div>
        </div>
        """,
        unsafe_allow_html=True
    )

# ---------------------------------------------------------
# 5. Main Canvas Header & Welcome UI
# ---------------------------------------------------------
st.markdown(
    """
    <div class="header-box">
        <div class="header-title">🤖 Hyyzo Knowledge Assistant</div>
        <div class="header-subtitle">Ask questions, query documentation, or explore system architecture instantly.</div>
    </div>
    """,
    unsafe_allow_html=True
)

# Prompt Suggestions on empty chat
if not current_chat["messages"]:
    st.markdown("##### 🚀 Quick Start Prompts")
    prompt_cols = st.columns(3)
    sample_prompts = [
        "What is the Rewards Architecture in Hyyzo?",
        "Explain how Rewards Gamification works.",
        "List the main feature components in rewards module."
    ]
    
    selected_prompt = None
    for i, p in enumerate(sample_prompts):
        with prompt_cols[i]:
            if st.button(p, key=f"sample_prompt_{i}", use_container_width=True):
                selected_prompt = p

# ---------------------------------------------------------
# 6. Chat Messages Rendering
# ---------------------------------------------------------
for message in current_chat["messages"]:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message and message["sources"]:
            with st.expander("📎 Retrieved Sources"):
                for src in message["sources"]:
                    st.markdown(
                        f"""<span class="source-chip">📄 <b>{src['file']}</b> &nbsp;|&nbsp; Score: <code>{src['score']}</code></span>""",
                        unsafe_allow_html=True
                    )

# ---------------------------------------------------------
# 7. User Input Processing
# ---------------------------------------------------------
prompt = st.chat_input("Ask anything about Hyyzo architecture, APIs, or features...")

# Handle sample prompt click if triggered
if 'selected_prompt' in locals() and selected_prompt:
    prompt = selected_prompt

if prompt:
    # Update Chat Title if it's the first message
    if not current_chat["messages"]:
        current_chat["title"] = prompt[:24] + "..." if len(prompt) > 24 else prompt

    # Display user message
    st.chat_message("user").markdown(prompt)
    current_chat["messages"].append({"role": "user", "content": prompt})

    # Generate assistant response
    with st.chat_message("assistant"):
        with st.spinner("Searching docs & generating answer..."):
            try:
                response = query_engine.query(prompt)
                response_text = str(response)
                st.markdown(response_text)

                sources = []
                if hasattr(response, "source_nodes") and response.source_nodes:
                    sources = [
                        {
                            "file": node.metadata.get("file_name", "unknown"),
                            "score": f"{node.score:.2f}" if node.score is not None else "N/A"
                        }
                        for node in response.source_nodes
                    ]
                    with st.expander("📎 Retrieved Sources"):
                        for src in sources:
                            st.markdown(
                                f"""<span class="source-chip">📄 <b>{src['file']}</b> &nbsp;|&nbsp; Score: <code>{src['score']}</code></span>""",
                                unsafe_allow_html=True
                            )

                current_chat["messages"].append({
                    "role": "assistant",
                    "content": response_text,
                    "sources": sources
                })

            except Exception as e:
                err_text = f"An error occurred while generating response: {e}"
                st.error(err_text)

