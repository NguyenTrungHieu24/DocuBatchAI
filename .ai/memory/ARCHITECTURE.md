# Architecture Notes — DocuBatch AI

## High-Level System Architecture

```
[ Mobile Browser ]  <--- LAN Wi-Fi (Polling & Upload) --->  [ FastAPI Server (main.py) ]
[ Desktop Browser ] <--- HTTP REST & Static Serving  --->  [ FastAPI Server (main.py) ]
                                                                     |
                       +-------------------+-------------------------+
                       |                   |                         |
               [ ConnectService ]  [ GeminiService ]         [ ExcelService ]
             (In-memory sessions)   (HTTPX Async)               (openpyxl)
                       |                   |                         |
                       v                   v                         v
                 PC-Phone sync     Google Gemini REST API       XLSX Stream
```

## Module Responsibilities
- `main.py`: Khởi tạo ứng dụng FastAPI, cấu hình CORS, thiết lập đường dẫn lưu trữ theo môi trường (PyInstaller `_MEIPASS`, Vercel `/tmp`, Local `uploads/`), mount thư mục static và định nghĩa toàn bộ 10 route REST API.
- `api/index.py`: Serverless handler xuất đối tượng `app` từ `main` cho Vercel.
- `run.py`: Điểm kích hoạt chạy local, tự động phát hiện IP LAN nội bộ (qua socket UDP tới 8.8.8.8), mở trình duyệt tự động và khởi chạy Uvicorn.
- `services/gemini_service.py`: Tương tác với Gemini REST API bằng `httpx.AsyncClient`. Xử lý dynamic model discovery (`/models`), cache danh sách model hỗ trợ theo API key, fallback tự động qua danh sách model ưu tiên (`gemini-2.0-flash`, `gemini-1.5-flash`), cấu hình structured output qua JSON Schema và giải quyết bóc tách đa dòng/đa bản ghi.
- `services/excel_service.py`: Tạo file Excel chuyên nghiệp với `openpyxl`. Tự động nhận diện template Bìa đất (`land_cover`) để tùy biến cấu trúc cột tinh gọn, hoặc định dạng bảng đầy đủ (STT, Tên file, các trường bóc tách, Tóm tắt AI, Trạng thái đối soát). Căn lề, zebra styling và auto-fit độ rộng cột.
- `services/connect_service.py`: Quản lý phiên kết nối không trạng thái tĩnh giữa PC và điện thoại trong bộ nhớ RAM (`sessions`), hỗ trợ heartbeat 15 giây, hàng đợi truyền file và truyền action từ điện thoại sang PC.
- `static/app.js`: Quản lý toàn bộ state client, queue kéo-thả, thực thi batch tuần tự tới backend, split-screen viewer (PDF iframe / ảnh), editor chỉnh sửa schema/template linh hoạt, xuất Excel/JSON và đồng bộ QR mobile.
- `static/mobile_connect.html`: Giao diện quét/chụp ảnh tài liệu trên điện thoại, hỗ trợ camera trước/sau, chụp 2 mặt bìa đất ghép nối, gửi tệp và kích hoạt AI trên PC.
- `packaging/DocuBatchAI.spec`: Kịch bản đóng gói PyInstaller cho Windows 1-file/1-folder console app kèm assets tĩnh và icon.

## Deployment & Packaging Paths
1. **Desktop Windows Standalone**: Chạy qua `DocuBatchAI.exe` hoặc `python run.py`. Upload lưu tại `<EXE_DIR>/uploads`. File tĩnh nhúng trong `_MEIPASS/static`.
2. **Serverless (Vercel)**: `vercel.json` rewrite toàn bộ request về `/api/index`. Thư mục upload đặt tại `/tmp/docubatch-uploads`.
3. **Container/PaaS (Render)**: Khởi chạy lệnh `uvicorn main:app --host 0.0.0.0 --port $PORT` thông qua `render.yaml`.
