# Coding Rules

- Follow the current Python style and dependency choices; inspect before enforcing a formatter.
- Keep FastAPI route handlers focused on HTTP orchestration.
- Keep Gemini-specific logic in `services/gemini_service.py` or a clearly justified service module.
- Keep Excel formatting/export logic in `services/excel_service.py`.
- Use type hints for new/modified public functions.
- Validate untrusted inputs at boundaries.
- Use clear, user-safe error messages; log diagnostic details server-side without secrets or document contents.
- Avoid broad `except Exception` unless it is a deliberate boundary with safe handling and useful logging.
- Avoid unnecessary synchronous blocking work inside async routes.
- Preserve local, serverless, and PyInstaller compatibility when touching paths/configuration.
- Add/update tests for parsing, validation, extraction response normalization, file handling, and export.
