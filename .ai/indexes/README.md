# Indexes

Generate these from the actual local checkout; do not hand-maintain large indexes.

Recommended initial indexes:
- `FILE_INDEX.json`: relative path, size, extension, SHA-256, role/summary.
- `FUNCTION_INDEX.json`: module, function/class name, line range, signature, docstring.
- `DEPENDENCY_INDEX.json`: imports and local module relationships.
- Optional `ROUTE_INDEX.json`: HTTP method, route, handler, request/response contract.

Exclude `.git/`, virtual environments, caches, `build/`, `dist/`, `uploads/`, generated binaries, `.env`, and private user documents.

Use Python AST for Python symbol indexing. Rebuild only changed files based on Git diff/hash; periodically perform a full consistency scan.
