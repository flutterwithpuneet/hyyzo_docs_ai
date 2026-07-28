"""
Hyyzo Docs AI — Streamlit Web Interface
Run: py -m streamlit run app.py
"""

import streamlit as st

from src.config import DOCS_DIR
from src.loader import load_documents
from src.engine import setup_models, build_index, load_index, get_query_engine

# Page setup
st.set_page_config(
    page_title="Hyyzo Docs AI",
    page_icon="🤖",
    layout="wide"
)

st.title("🤖 Hyyzo Docs AI Assistant")
st.caption("Ask questions grounded in your Hyyzo knowledge documents.")

@st.cache_resource(show_spinner=False)
def initialize_query_engine():
    """Setup models and load/build vector index once."""
    setup_models()
    index = load_index()
    if index is None:
        with st.spinner("Building index from documents..."):
            documents = load_documents(DOCS_DIR)
            index = build_index(documents)
    return get_query_engine(index)

# Load engine
try:
    query_engine = initialize_query_engine()
except Exception as e:
    st.error(f"Failed to initialize AI engine: {e}")
    st.stop()

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display prior chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message and message["sources"]:
            with st.expander("📎 Retrieved Sources"):
                for src in message["sources"]:
                    st.write(f"- **{src['file']}** (similarity score: `{src['score']}`)")

# Chat input
if prompt := st.chat_input("Ask anything about Hyyzo..."):
    # Display user message
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Generate assistant response
    with st.chat_message("assistant"):
        with st.spinner("Thinking..."):
            try:
                response = query_engine.query(prompt)
                response_text = str(response)
                st.markdown(response_text)

                sources = []
                if response.source_nodes:
                    sources = [
                        {
                            "file": node.metadata.get("file_name", "unknown"),
                            "score": f"{node.score:.2f}" if node.score is not None else "N/A"
                        }
                        for node in response.source_nodes
                    ]
                    with st.expander("📎 Retrieved Sources"):
                        for src in sources:
                            st.write(f"- **{src['file']}** (similarity score: `{src['score']}`)")

                st.session_state.messages.append({
                    "role": "assistant",
                    "content": response_text,
                    "sources": sources
                })

            except Exception as e:
                err_text = f"An error occurred while generating response: {e}"
                st.error(err_text)
