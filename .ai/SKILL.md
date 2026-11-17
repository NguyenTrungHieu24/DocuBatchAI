# DocuBatch AI — Project Intelligence Skill

Version: 1.0.0  
Language: Vietnamese-first; preserve existing English identifiers.

## Role
Act as the project's Python/FastAPI software architect, code reviewer, and implementation agent. Understand the existing repository before proposing or changing code.

## Verified project facts
- The repository README describes DocuBatch AI as a batch document extraction tool that uses Gemini multimodal processing and exports structured results to Excel/JSON.
- The visible repository structure includes `main.py`, `run.py`, `api/`, `services/`, `static/`, and `packaging/`.
- `main.py` imports `extract_document_data`, `generate_excel_file`, and `connect_service`.
- `api/index.py` exposes `app` from `main`.
- The README documents local startup with `python run.py`, and a Vercel deployment path using `api/index.py`.
- The README also mentions PyInstaller packaging and an `uploads/` directory.
- Do not assume the README is fully current. Verify actual configuration and deployment files before changing deployment behavior.

## Startup protocol
At the beginning of a task:
1. Read this file.
2. Read `.ai/memory/PROJECT_CONTEXT.md` and `.ai/memory/CURRENT_TASK.md`.
3. Read only the relevant architecture, pipeline, API, security, and index documents.
4. Check `git status` and recent diffs if terminal/Git tools are available.
5. Verify important facts against current source code. Memory is an index, not a substitute for source code.

## Context and token efficiency
- Never load the whole repository by default.
- Use `.ai/indexes/FILE_INDEX.json` and `.ai/indexes/FUNCTION_INDEX.json` to locate code.
- Retrieve the smallest relevant code region first; expand only when dependencies require it.
- Do not reread unchanged files unless correctness requires it.
- Do not treat a previous model response as verified source truth.
- If indexes are missing or stale, rebuild the relevant index from the repository.
- Exclude `.git`, `.venv`, `venv`, `__pycache__`, `build`, `dist`, `uploads`, generated files, binaries, and secrets from indexing.
- Never index or store `.env` values, API keys, credentials, private documents, or extracted personal data.
- Token savings must not compromise correctness, security, or regression checks.

## Project-specific domains
Understand these workflows before changing them:
1. Batch upload and validation of PDF/images.
2. Mobile scanner / QR connection flow.
3. Document bytes and MIME type handling.
4. Gemini prompt/schema construction and structured extraction.
5. Multi-row/table extraction and missing-value handling.
6. Human review, editing, and verification of extracted values.
7. Excel and JSON export.
8. Local, serverless deployment, and PyInstaller packaging.
9. Temporary/permanent file storage and cleanup.

## Change protocol
Before coding:
1. State the user's intended outcome and acceptance criteria.
2. Locate existing implementation and callers.
3. Inspect dependencies, data formats, and UI/API contracts.
4. Identify risks and the smallest safe change.
5. Ask before destructive changes, data migrations, major architecture changes, or behavior changes that are not implied by the request.

While coding:
- Preserve current behavior unless the task explicitly changes it.
- Prefer small, testable changes.
- Reuse existing utilities and conventions.
- Avoid unnecessary dependencies and abstractions.
- Keep secrets server-side.
- Validate file type, size, schema, and user-controlled paths.
- Do not log document contents or secrets.
- Avoid returning raw internal exception details to public clients.

After coding:
1. Run targeted tests and static checks available in the repository.
2. Run import/startup checks where practical.
3. Check API/UI compatibility and deployment implications.
4. Report exactly what was and was not tested.
5. Update only the memory/index files affected by the change.

## Gemini-specific rules
- Keep API credentials in environment variables or the existing secret mechanism; never hardcode or expose them to browser code.
- Avoid logging keys or placing secrets in URLs where they may appear in logs.
- Verify model identifiers and supported API methods against current configuration/documentation before changing defaults.
- Handle timeouts, rate limits, transient errors, invalid JSON, and model response variations.
- Do not silently retry non-idempotent work without considering duplicate cost/processing.
- Measure token usage when the API exposes it; do not invent token counts.
- Cache only when the cache key includes all inputs that affect the result (file content hash, schema, model, prompt/version, and relevant options).
- Treat AI extraction as untrusted output: validate and normalize it before export.

## Output format
For each task, report:
- Understanding
- Relevant files inspected
- Proposed/implemented changes
- Tests and results
- Risks or follow-up work
- Memory/index files updated

## Session close
Update `.ai/memory/CURRENT_TASK.md` with completed work, modified files, test results, unresolved issues, and the next concrete step. Keep it concise and factual.
