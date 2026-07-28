# Glossary

| Term                        | Definition                                                                                                     |
|-----------------------------|----------------------------------------------------------------------------------------------------------------|
| **RAG**                     | Retrieval Augmented Generation — a technique that retrieves relevant documents and feeds them to an LLM to generate grounded answers. |
| **LLM**                     | Large Language Model — a neural network trained on vast text data capable of understanding and generating human language.              |
| **Embedding**               | A dense numerical vector that represents the semantic meaning of a piece of text.                              |
| **Vector Index**            | A data structure that stores embeddings and enables fast similarity search.                                     |
| **Chunk**                   | A segment of a document created by splitting the original text into smaller, overlapping pieces.               |
| **Chunk Overlap**           | The number of tokens shared between consecutive chunks to preserve context across boundaries.                  |
| **Sentence Transformer**   | A family of HuggingFace models that produce high-quality sentence-level embeddings.                            |
| **LlamaIndex**              | An open-source RAG framework that simplifies data ingestion, indexing, and querying over custom documents.      |
| **Similarity Search**       | Finding the most semantically similar vectors to a query vector in a vector index.                             |
| **Temperature**             | A parameter controlling the randomness of LLM outputs. Lower values produce more deterministic answers.        |
| **Token**                   | The smallest unit of text processed by an LLM (roughly ¾ of a word on average).                               |
| **Ingestion Pipeline**      | The end-to-end process of loading, chunking, embedding, and indexing documents.                                |
| **Persist**                 | Saving the vector index to disk so it can be reloaded without re-computing embeddings.                         |
