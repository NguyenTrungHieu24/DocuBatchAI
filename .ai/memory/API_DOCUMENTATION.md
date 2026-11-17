# API Documentation — DocuBatch AI

Tất cả các endpoint được định nghĩa trong `main.py` và chạy trên FastAPI.

## Endpoints

| Method | Path | Request Content-Type / Payload | Response | Mô tả |
|---|---|---|---|---|
| `GET` | `/` | None | `text/html` | Trả về giao diện chính `static/index.html` hoặc thông báo lỗi nếu thiếu file |
| `GET` | `/api/config` | None | `application/json` | Trả về `{"gemini_api_key_configured": bool}` (kiểm tra `GEMINI_API_KEY` hoặc `GOOGLE_API_KEY`) |
| `GET` | `/files/{file_id}` | None | `FileResponse` | Phục vụ file tài liệu đã upload; kiểm tra path traversal an toàn bằng `os.path.commonpath` |
| `POST` | `/api/extract` | `multipart/form-data`<br>- `file`: UploadFile<br>- `schema_json`: Form(str)<br>- `model`: Optional Form(str) | `application/json` | Lưu file tạm, gọi Gemini bóc tách dữ liệu theo schema; trả về `file_url`, `content_type`, `extracted_data` |
| `POST` | `/api/export/excel` | `application/json`<br>`ExportRequest`: `{ records: list, schema_fields: list }` | `application/vnd.openxmlformats-...` | Xuất file Excel `.xlsx` dạng StreamingResponse kèm header `attachment; filename=DocuBatch_Export.xlsx` |
| `GET` | `/connect` | None | `text/html` | Trả về trang giao diện chụp ảnh di động `static/mobile_connect.html` |
| `GET` | `/api/connect/info` | None | `application/json` | Trả về `local_ip`, `available_ips`, `port`, `mobile_host`, `connect_url`, `app_url` |
| `POST` | `/api/connect/session/create` | None | `application/json` | Khởi tạo phiên kết nối mới giữa PC và điện thoại (`sess_{uuid4[:10]}`) |
| `GET` | `/api/connect/session/{session_id}/status` | None | `application/json` | PC kiểm tra trạng thái heartbeat điện thoại, nhận danh sách `new_files` và `actions` vừa gửi |
| `POST` | `/api/connect/session/{session_id}/ping` | `application/json`<br>`PingPayload`: `{ client?: str, info?: str }` | `application/json` | Điện thoại gửi heartbeat để duy trì trạng thái online (< 15s) |
| `POST` | `/api/connect/session/{session_id}/upload` | `multipart/form-data`<br>- `file`: UploadFile<br>- `document_type`: Optional Form(str) | `application/json` | Điện thoại upload ảnh chụp/tài liệu sang PC qua session |
| `POST` | `/api/connect/session/{session_id}/action` | `application/json`<br>`ActionPayload`: `{ action: str, data?: dict }` | `application/json` | Điện thoại gửi lệnh điều khiển sang PC (ví dụ `start_extraction`) |

## Quy ước Dữ liệu & Error Handling
- Lỗi xử lý trích xuất tại `/api/extract` trả về mã HTTP `500` kèm JSON `{ success: false, error: str, file_id: str, filename: str }` để frontend hiển thị chi tiết lên hàng đợi mà không làm gián đoạn toàn bộ batch.
- Các route kiểm tra schema JSON hoặc format file không hợp lệ trả về HTTP `400 HTTPException`.
- Route `/files/{file_id}` trả về HTTP `404 HTTPException` nếu tên file có dấu hiệu thoát thư mục (`safe_file_id != file_id` hoặc không nằm trong `upload_root`).
