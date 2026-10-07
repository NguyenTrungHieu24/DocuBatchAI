# DocuBatch AI - Trợ lý Xử lý & Trích xuất Đa Tài Liệu Hàng Loạt

Ứng dụng hỗ trợ đọc, bóc tách và chuẩn hóa thông tin từ hàng loạt tài liệu (Hóa đơn, Hợp đồng, CV, Đơn hàng, Chứng từ,...) bằng sức mạnh Multimodal của **Gemini 2.5 Flash / 1.5 Flash**.

---

## 🌟 Tính Năng Nổi Bật

1. **Kéo thả hàng loạt (Batch Drop):** Tải lên cùng lúc nhiều tệp PDF, ảnh chụp hóa đơn (PNG, JPG, WEBP).
2. **Tùy biến trường trích xuất (Flexible Schema):** 
   - Hóa đơn / Chứng từ thanh toán.
   - Hợp đồng kinh tế / Thỏa thuận.
   - Hồ sơ ứng viên / CV.
   - Đơn đặt hàng / Giao hàng.
   - *Tùy chỉnh:* Thêm/bớt/đổi tên các trường bất kỳ theo nhu cầu nghiệp vụ của bạn.
3. **Màn hình Đối soát song song (Split-Screen Review):**
   - Bên trái: Xem trực tiếp tài liệu gốc (PDF/ảnh).
   - Bên phải: Form chứa các giá trị AI bóc tách được để người dùng kiểm tra, chỉnh sửa và đánh dấu "Đã đối soát".
4. **Xuất bảng tính Excel chuyên nghiệp (.xlsx):**
   - Tự động sinh file Excel với tiêu đề, format chuẩn bảng biểu, căn chỉnh độ rộng cột và phân cách dòng rõ ràng.
   - Hỗ trợ xuất định dạng JSON.
5. **Bảo mật & Cục bộ:** Tài liệu và API key được lưu trực tiếp trên máy của bạn.

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

### Troubleshooting extraction

Document extraction sends files to the Gemini API, so the machine running this app must have outbound internet access to `generativelanguage.googleapis.com`. If extraction reports `Cannot connect to the Gemini API`, check the network connection, firewall, VPN, or proxy settings. An API key alone is not enough when the API host is unreachable.

---

## 🔑 Cấu Hình API Key
1. Bấm vào nút **"Cấu hình API Key"** ở góc trên bên phải giao diện.
2. Dán mã Gemini API Key của bạn (có thể tạo miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Bấm **"Lưu cấu hình"**.
