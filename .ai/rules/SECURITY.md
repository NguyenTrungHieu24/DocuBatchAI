# Security Rules

- Never commit `.env`, API keys, tokens, credentials, or private documents.
- Never expose Gemini credentials to browser JavaScript or API responses.
- Avoid putting API keys in URLs because URLs may be logged; use the provider's supported secure authentication mechanism.
- Enforce upload size limits and allowlisted file types; do not trust client MIME type or extension alone.
- Generate server-side storage names; prevent path traversal.
- Apply access controls before serving uploaded files if the application has multiple users or private documents.
- Restrict CORS to known origins in production; review wildcard origins with credentials enabled.
- Return generic client errors and keep detailed diagnostics in redacted server logs.
- Define upload retention and cleanup.
- Treat model output and uploaded documents as untrusted input.
