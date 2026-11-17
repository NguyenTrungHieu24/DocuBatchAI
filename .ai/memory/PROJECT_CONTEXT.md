# Project Context — DocuBatch AI

## Purpose
DocuBatch AI (Sáng kiến Chuyển đổi số - Nguyễn Trung Hiếu, ĐH FPT / UBND Phường Hiệp Hòa) là công cụ web & desktop hỗ trợ đọc, bóc tách và chuẩn hóa thông tin từ hàng loạt tài liệu hành chính, hóa đơn, giấy tờ đất đai bằng Trí tuệ nhân tạo Đa phương thức (Multimodal AI - Gemini) kết hợp xuất dữ liệu ra Excel/JSON và quét nhanh từ điện thoại qua QR Code LAN.

## Verified Repository Facts (Checkout 2026-11-17)
- **Framework & Backend**: Python 3.11+ / FastAPI 0.110+ với Uvicorn.
- **AI Integration**: Trực tiếp qua `httpx` gọi REST API của Google Generative Language (`v1beta`/`v1`), không dùng SDK `google-generativeai` để tối ưu kích thước gói và kiểm soát linh hoạt cơ chế fallback.
- **Excel Engine**: `openpyxl` tạo bảng tính chuyên nghiệp, định dạng riêng cho Bìa đất và hồ sơ hành chính tổng hợp.
- **Desktop Runtime**: Hỗ trợ chạy local qua `run.py` (tự động lấy IP mạng LAN, mở trình duyệt sau 1.2s) và đóng gói standalone Windows EXE bằng PyInstaller (`packaging/DocuBatchAI.spec`).
- **Cloud/Deployment**:
  - Hỗ trợ serverless Vercel qua `api/index.py` (rewrites trong `vercel.json`, upload tạm tại `/tmp/docubatch-uploads`).
  - Cấu hình Render qua `render.yaml` (dùng Uvicorn, port từ biến môi trường `$PORT`).
- **Mobile Connect**: Hệ thống ghép nối PC-Mobile nội bộ qua mã QR và mạng LAN Wi-Fi (không cần cài app di động, dùng mobile web tại `/connect`).

## Runtime Dependencies (requirements.txt)
- `fastapi>=0.110.0`
- `uvicorn>=0.28.0`
- `python-multipart>=0.0.9`
- `openpyxl>=3.1.2`
- `httpx>=0.27.0`
- `pydantic>=2.6.0`
- `python-dotenv>=1.0.0`

## Security & Privacy Boundary
- File `.env` chứa `GEMINI_API_KEY` tuyệt đối không commit và không gửi về phía client.
- Phía client chỉ kiểm tra cờ boolean trạng thái qua `/api/config`.
- Không lập chỉ mục hay lưu trữ tài liệu trong `uploads/`, thư mục cache, môi trường ảo hay `.env`.
