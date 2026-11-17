# Token Optimization Rules

1. Load the short project context first, not the whole repository.
2. Search indexes by route, symbol, filename, and feature.
3. Read the implementation plus direct callers/callees required to understand the change.
4. Use Git diff to identify changed files; do not assume unchanged files are safe if interfaces changed.
5. Cache summaries with file hash and index version; invalidate when the hash changes.
6. Keep summaries factual and concise; include source path and symbol names.
7. Do not put source code, secrets, uploads, or personal documents into vector stores by default.
8. For small repositories, prefer symbol/file indexes and grep before adding embeddings.
9. Use embeddings/RAG only when lexical/symbol search is insufficient or the corpus grows.
10. Never claim that retrieval found all relevant code without checking dependency paths.
