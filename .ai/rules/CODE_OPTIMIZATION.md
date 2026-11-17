# Code Optimization Rules

Optimize only after establishing a baseline and preserving behavior.

Check:
- Repeated file reads and unnecessary byte copies.
- Upload size/type limits and streaming behavior.
- Blocking work inside async endpoints.
- Gemini request latency, retries, timeouts, and rate limits.
- Prompt/schema size and duplicated document submission.
- Validation of structured model output.
- Excel generation memory use for large datasets.
- File retention and cleanup.
- Error handling and observability.

Measure before/after where practical. Do not make speculative performance claims.
