# Testing Rules

Before changing behavior, identify current tests and runtime commands.

Suggested test areas:
- MIME/type and upload validation.
- Empty, oversized, malformed, and unsupported files.
- Invalid extraction schema.
- Gemini timeout, rate limit, invalid response, and provider error.
- Structured extraction normalization and missing fields.
- Multi-row/table extraction.
- File ID/path traversal protection.
- Excel headers, row values, and special characters.
- Mobile upload and frontend/API contract.
- Local startup and serverless import.
- PyInstaller packaging when packaging-related code changes.

Report commands and actual outcomes. Never claim an unexecuted test passed.
