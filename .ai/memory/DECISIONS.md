# Technical Decisions — DocuBatch AI

Record decisions using:
- Date
- Context
- Decision
- Alternatives considered
- Consequences
- Related files

## Established Architecture Decisions

### 1. Direct HTTPX over Official Google Generative AI SDK
- **Date**: 2026-11-17 (Recorded from implementation)
- **Context**: Ứng dụng cần chạy linh hoạt cả trên local, serverless (Vercel) và đóng gói PyInstaller EXE nhỏ gọn.
- **Decision**: Sử dụng trực tiếp `httpx.AsyncClient` gọi REST API endpoint của Google (`generativelanguage.googleapis.com`) thay vì cài đặt thư viện `google-generativeai` hoặc `google-genai`.
- **Alternatives considered**: Thư viện chính thức `google-generativeai` / `google-genai`.
- **Consequences**: Giảm đáng kể dung lượng gói bundle PyInstaller, tránh phụ thuộc vào gRPC/Protobuf cồng kềnh, dễ dàng xử lý fallback giữa `v1` và `v1beta` cũng như các model 404.
- **Related files**: `services/gemini_service.py`, `requirements.txt`, `packaging/DocuBatchAI.spec`.

### 2. Client-Side Sequential Batch Processing
- **Date**: 2026-11-17 (Recorded from implementation)
- **Context**: Người dùng có thể kéo thả hàng chục tài liệu cùng lúc, mỗi tài liệu mất vài giây để AI xử lý.
- **Decision**: Frontend (`static/app.js`) duy trì hàng đợi (`state.fileQueue`) và gửi từng file tuần tự (sequential) tới endpoint `/api/extract` của backend thay vì gửi một request multipart chứa toàn bộ file.
- **Alternatives considered**: Batch upload endpoint trên server xử lý song song background tasks hoặc Celery queue.
- **Consequences**: Backend giữ stateless và đơn giản, không cần Redis/Celery; frontend hiển thị tiến độ thời gian thực (spinner, trạng thái từng file, toast); người dùng thấy kết quả xuất hiện ngay sau khi từng tài liệu được bóc tách xong.
- **Related files**: `static/app.js`, `main.py`.

### 3. Server-Side Secret Storage
- **Date**: 2026-11-17 (Recorded from implementation)
- **Context**: Bảo vệ `GEMINI_API_KEY` khỏi bị lộ khi người dùng sử dụng ứng dụng web.
- **Decision**: API key chỉ lưu trên server thông qua file `.env` hoặc biến môi trường; endpoint `/api/config` chỉ trả về cờ boolean `gemini_api_key_configured`. Frontend chủ động xóa `localStorage.removeItem("docubatch_api_key")`.
- **Consequences**: Ngăn ngừa rò rỉ API key ra client, đảm bảo an toàn trong môi trường mạng nội bộ hoặc triển khai public.
- **Related files**: `main.py`, `static/app.js`.

### 4. QR LAN Session Pairing for Mobile Capture
- **Date**: 2026-11-17 (Recorded from implementation)
- **Context**: Nhu cầu số hóa tài liệu từ điện thoại mà không yêu cầu cài đặt ứng dụng native từ App Store / Google Play.
- **Decision**: Xây dựng cơ chế phiên kết nối qua RAM (`ConnectService`), phát hiện IP nội bộ của máy chủ qua socket UDP, tạo mã QR liên kết tới web app di động `/connect?session={id}` và polling định kỳ.
- **Consequences**: Trải nghiệm mượt mà không cần cài đặt; phụ thuộc vào việc PC và điện thoại phải cùng lớp mạng Wi-Fi/LAN.
- **Related files**: `services/connect_service.py`, `static/mobile_connect.html`, `static/app.js`, `run.py`.
