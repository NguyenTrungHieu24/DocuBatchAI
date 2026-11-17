# AI / Document Processing Pipeline — DocuBatch AI

## End-to-End Processing Flow

```
1. Input Selection (PC Dropzone / Camera Modal / Mobile QR Upload)
   │
   ▼
2. Client Queue Management (`static/app.js`: `state.fileQueue`)
   │
   ▼
3. Batch Execution Loop (Sequential POST `/api/extract` for each file)
   │
   ├─► Server stores file with UUID in `uploads/`
   ├─► Content-Type auto-detection (PDF, PNG, JPG, WEBP)
   ├─► Dynamic Model Discovery & Fallback (`services/gemini_service.py`)
   ├─► Base64 encoding & Structured Schema Prompt construction
   ├─► Gemini API call (generationConfig: application/json, responseSchema)
   └─► Normalization: unnesting `items` array, `_ai_summary`, `_confidence_score`
   │
   ▼
4. Frontend Data Expansion
   │
   ├─► 1 document with N items in `items` expands to N rows in UI:
   │   `{filename} (dòng 1)`, `{filename} (dòng 2)`, ...
   └─► Populates result table and file queue status indicators
   │
   ▼
5. Human Verification & Correction (Split-Screen Review Modal)
   │
   ├─► Left pane: Document viewer (Iframe for PDF, <img> for images)
   ├─► Right pane: Dynamic input fields bound to schema + AI Summary + Confidence %
   └─► Action: User edits values, toggles "Đã đối soát" (`verified = true`)
   │
   ▼
6. Export Pipeline
   │
   ├─► Excel: POST `/api/export/excel` -> `services/excel_service.py` -> OpenPyXL XLSX stream
   │   (Auto-detects `land_cover` schema for specialized 5-column layout)
   └─► JSON: Client-side JSON blob serialization & download
```

## Gemini Prompt & Schema Strategy
- **Prompt Architecture**:
  - `systemInstruction`: Định rõ vai trò chuyên gia trích xuất, nhấn mạnh quy tắc bắt buộc duyệt qua tất cả các hàng/bản ghi trong bảng/danh sách để đưa vào mảng `items`. Nếu trường vắng mặt thì để rỗng `""` hoặc `"N/A"`, không bịa đặt.
  - `contents`: Gồm `inline_data` (Base64 file bytes) và `prompt_text` chứa danh sách chi tiết các trường yêu cầu.
  - `responseSchema`: Ép cấu trúc JSON trả về với các thuộc tính:
    - `_ai_summary`: Chuỗi tóm tắt 1-2 câu về văn bản.
    - `_confidence_score`: Điểm tin cậy từ 0.0 đến 1.0.
    - `items`: Mảng các đối tượng chứa đúng các trường trong schema người dùng đã định nghĩa.
  - `temperature`: Đặt ở mức `0.1` để tối đa hóa tính tất định và độ chính xác của trích xuất thông tin.

## Model Fallback Mechanism
- Ưu tiên kiểm tra danh sách model khả dụng thực tế của API key qua endpoint `/models` (hỗ trợ `generateContent`).
- Thứ tự ưu tiên mặc định (`PREFERRED_MODELS`):
  1. `gemini-2.0-flash`
  2. `gemini-2.0-flash-exp`
  3. `gemini-1.5-flash-latest`
  4. `gemini-1.5-flash`
  5. `gemini-1.5-flash-001`
  6. `gemini-1.5-flash-002`
  7. `gemini-1.5-pro-latest`
  8. `gemini-1.5-pro`
- Nếu gặp lỗi HTTP 404 (Model Not Found), tự động thử model tiếp theo trong danh sách candidate trên cả 2 phiên bản API `v1beta` và `v1`.
