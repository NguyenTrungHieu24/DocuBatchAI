# DocuBatch AI - Trợ lý Xử lý & Trích xuất Đa Tài Liệu Hàng Loạt

Ứng dụng hỗ trợ đọc, bóc tách và chuẩn hóa thông tin từ hàng loạt tài liệu bằng sức mạnh Multimodal của **Gemini 2.5 Flash / 1.5 Flash**.

---

## Cấu trúc thư mục

- `main.py`, `run.py`: ứng dụng FastAPI và lệnh chạy local.
- `api/`, `services/`, `static/`: API deploy, xử lý nghiệp vụ và giao diện web.
- `packaging/`: cấu hình PyInstaller để tạo bản EXE.
- `uploads/`: tài liệu người dùng; không xóa khi dọn mã nguồn.
- `build/`, `dist/`: thư mục PyInstaller tự tạo khi đóng gói, không chỉnh sửa thủ công.
- `.env`, `.venv/`: cấu hình API key và môi trường Python local; không chia sẻ/commit.

## 🌟 Tính Năng Nổi Bật

1. **Kéo thả hàng loạt (Batch Drop):** Tải lên cùng lúc nhiều tệp PDF, ảnh chụp hóa đơn (PNG, JPG, WEBP).
2. **Tùy biến trường trích xuất (Flexible Schema):** 
   - Đơn đặt hàng / Giao hàng.
   - *Tùy chỉnh:* Thêm/bớt/đổi tên các trường bất kỳ theo nhu cầu nghiệp vụ của bạn.
3. **Màn hình Đối soát song song (Split-Screen Review):**
   - Bên trái: Xem trực tiếp tài liệu gốc (PDF/ảnh).
   - Bên phải: Form chứa các giá trị AI bóc tách được để người dùng kiểm tra, chỉnh sửa và đánh dấu "Đã đối soát".
4. **Xuất bảng tính Excel chuyên nghiệp (.xlsx):**
   - Tự động sinh file Excel với tiêu đề, format chuẩn bảng biểu, căn chỉnh độ rộng cột và phân cách dòng rõ ràng.
   - Hỗ trợ xuất định dạng JSON.
5. **Quét mã QR kết nối điện thoại (Mobile Scanner):**
   - Quét mã QR trên màn hình bằng camera điện thoại hoặc Zalo (cùng mạng Wi-Fi).
   - Chụp ảnh hóa đơn, chứng từ trực tiếp bằng camera độ nét cao của điện thoại hoặc chọn nhiều ảnh/PDF từ máy.
   - Tài liệu tự động chuyển thẳng sang danh sách xử lý trên màn hình máy tính trong tích tắc.
   - Chụp hai mặt của nhiều loại giấy tờ bằng điện thoại; ứng dụng ghép ảnh thành một tài liệu. Bìa giấy chứng nhận tự chọn mẫu riêng, các loại khác dùng mẫu đang chọn trên máy tính.
6. **Bảo mật:** Gemini và Dify API key chỉ được lưu trong file `.env` trên máy chủ; trình duyệt không nhận hoặc lưu key.
7. **Trợ lý đất đai:** Mở nút “Hỏi trợ lý đất đai” ở góc dưới để trò chuyện với agent Dify về hồ sơ, thủ tục và quy trình. Agent và kho kiến thức được cấu hình riêng trên Dify.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Cài đặt thư viện cần thiết (chỉ chạy lần đầu)
```powershell
pip install -r requirements.txt
```

### 2. Khởi chạy ứng dụng
```powershell
python run.py
```

### 3. Mở trình duyệt
Truy cập địa chỉ: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

### 4. Cấu hình Gemini API Key
Sao chép `.env` thành `.env` ở thư mục gốc, sau đó thêm key:
```env
GEMINI_API_KEY=AIzaSy...
```
Khởi động lại ứng dụng sau khi sửa `.env`. Không commit hoặc chia sẻ file `.env`.

### 5. Kết nối trợ lý dự án với Dify

1. Tạo ứng dụng Chatflow hoặc Agent trong Dify, thêm chỉ dẫn phù hợp cho trợ lý đất đai và kết nối kho kiến thức từ nguồn pháp lý chính thức, còn hiệu lực.
2. Xuất bản ứng dụng, mở **API Access** của ứng dụng và tạo API key.
3. Thêm cấu hình sau vào `.env` của DocuBatch AI:
```env
DIFY_API_KEY=app-...
DIFY_API_BASE_URL=https://api.dify.ai/v1
```
Với Dify tự host, đặt `DIFY_API_BASE_URL` thành địa chỉ máy chủ Dify kèm `/v1`. API key chỉ được gửi từ backend DocuBatch đến Dify, không đưa xuống trình duyệt. `DIFY_API_KEY` dùng cho chat; `GEMINI_API_KEY` dùng riêng cho chức năng trích xuất tài liệu.

### Deploy trên Vercel

Vercel dùng `api/index.py` làm entrypoint cho FastAPI. Trong Project Settings → Environment Variables, đặt `GEMINI_API_KEY` cho trích xuất, `DIFY_API_KEY` cho chat và nếu cần `DIFY_API_BASE_URL`, sau đó redeploy để áp dụng. Tệp tải lên trên Vercel được lưu tạm trong `/tmp` và không được giữ lại lâu dài.

### Troubleshooting extraction

Document extraction sends files to the Gemini API, so the machine running this app must have outbound internet access to `generativelanguage.googleapis.com`. If extraction reports `Cannot connect to the Gemini API`, check the network connection, firewall, VPN, or proxy settings. An API key alone is not enough when the API host is unreachable.

---

Tạo Gemini API Key tại [Google AI Studio](https://aistudio.google.com/app/apikey).
