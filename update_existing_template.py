import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Báo cáo sáng kiến chuyển đổi số - Report Template.docx")
print("Đang mở tệp:", file_path)

doc = docx.Document(file_path)

# 1. Cập nhật Section 1.1
doc.paragraphs[10].text = (
    "Báo cáo đề xuất giải pháp sáng kiến chuyển đổi số được thực hiện bởi sinh viên Nguyễn Trung Hiếu "
    "(Mã sinh viên: HE180624) – chuyên ngành Kỹ thuật Phần mềm, Trường Đại học FPT. Xuất phát từ quá trình "
    "thực tập và khảo sát thực tế công tác giải quyết thủ tục hành chính, tác giả đã ứng dụng các kiến thức chuyên sâu "
    "về công nghệ web hiện đại, xử lý bất đồng bộ và Trí tuệ nhân tạo Đa phương thức (Multimodal AI) để xây dựng hệ thống "
    "DocuBatch AI nhằm giải quyết triệt để nút thắt số hóa dữ liệu hồ sơ đầu vào."
)

doc.paragraphs[11].text = (
    "Đơn vị thực tập và tiếp nhận triển khai thử nghiệm sáng kiến là Phòng Kinh tế - Hạ tầng & Đô thị "
    "phối hợp cùng Bộ phận Tiếp nhận & Trả kết quả (Một cửa) – UBND Phường Hiệp Hòa:"
)

doc.paragraphs[12].text = (
    "• Lĩnh vực hoạt động: Thực thi công tác quản lý nhà nước về kinh tế, hạ tầng kỹ thuật đô thị, quy hoạch xây dựng "
    "và phối hợp quản lý đất đai, địa chính; tiếp nhận, số hóa và giải quyết các thủ tục hành chính công cho tổ chức, "
    "cá nhân trên địa bàn phường."
)

doc.paragraphs[13].text = (
    "• Quy mô tiếp nhận: Trung bình mỗi ngày bộ phận tiếp nhận và xử lý từ 100 đến 200 bộ hồ sơ các loại (bao gồm hồ sơ "
    "cấp đổi/đăng ký biến động quyền sử dụng đất, trích lục bản đồ địa chính 2 cấp, hồ sơ cấp phép xây dựng, thông tin "
    "quy hoạch, căn cước công dân, đơn thư kiến nghị, hóa đơn và biên lai nộp thuế/phí...)."
)

doc.paragraphs[14].text = (
    "• Mối liên hệ trọng tâm với đề tài: Khâu số hóa dữ liệu đầu vào hiện nay đang là điểm nghẽn lớn nhất trong quy trình "
    "dịch vụ công tại đơn vị. Cán bộ thụ lý phải mở file scan/ảnh chụp và dùng mắt đọc rồi gõ tay từng ký tự vào hệ thống "
    "Một cửa hoặc bảng tính Excel, chiếm nhiều giờ làm việc mỗi ngày và tiềm ẩn rủi ro sai lệch các số liệu kỹ thuật đất đai, "
    "số CCCD và thông tin quy hoạch."
)

# 2. Cập nhật P39 (2.1. Mục tiêu ngắn hạn)
doc.paragraphs[39].text = (
    "• Mục tiêu ngắn hạn (3 – 6 tháng): Triển khai vận hành thử nghiệm tại 100% các bàn tiếp nhận hồ sơ Một cửa và các "
    "cán bộ phụ trách địa chính – hạ tầng đô thị tại UBND Phường Hiệp Hòa. Cắt giảm ít nhất 85% thời gian nhập liệu thủ công; "
    "đạt độ chính xác bóc tách thô của AI trên 95% và độ chính xác đối soát đạt 100% trước khi xuất dữ liệu sang Excel."
)

# 3. Cập nhật P69 (3.1. Giai đoạn 2 Mở rộng)
doc.paragraphs[69].text = (
    "• Giai đoạn 2: Mở rộng (Rollout Phase - Tháng 11 đến 12/2026): Triển khai đồng loạt cho toàn bộ các bộ phận chuyên môn "
    "tại UBND Phường Hiệp Hòa (địa chính, xây dựng, hộ tịch, kế toán) và sẵn sàng chia sẻ mô hình cho các xã/phường lân cận "
    "trên địa bàn thị xã/huyện. Tổ chức tập huấn, đào tạo cán bộ sử dụng; hoàn thiện tài liệu hướng dẫn và video thao tác 3 phút."
)

# 4. Cập nhật P85 & P87 (4.2. Phản hồi của đơn vị)
doc.paragraphs[85].text = (
    "Cán bộ phụ trách lĩnh vực Địa chính – Xây dựng tại Phòng Kinh tế - Hạ tầng & Đô thị và Bộ phận Một cửa UBND Phường Hiệp Hòa đánh giá:"
)

doc.paragraphs[87].text = (
    "Lãnh đạo UBND Phường Hiệp Hòa đồng thuận cao về mặt chủ trương áp dụng chính thức giải pháp vào quy trình số hóa "
    "hồ sơ thủ tục hành chính của phường; đồng thời khuyến khích tác giả tiếp tục hoàn thiện, mở rộng các mẫu bóc tách cho "
    "lĩnh vực trích lục quy hoạch và trích lục hộ tịch trong giai đoạn tới."
)

# 5. Cập nhật Bảng 6 (Table 6: Bảng phân công nhiệm vụ WBS)
table_wbs = doc.tables[6]

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def style_cell(cell, text, bold=False, align=WD_ALIGN_PARAGRAPH.LEFT, color=None, bg_color=None):
    if bg_color:
        set_cell_background(cell, bg_color)
    p = cell.paragraphs[0]
    p.text = text
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    for run in p.runs:
        run.font.name = "Times New Roman"
        run.font.size = Pt(11)
        run.bold = bold
        if color:
            run.font.color.rgb = color

# Header Bảng 6
headers_wbs = ["Họ và tên & MSSV", "Nhiệm vụ chuyên môn phụ trách", "Sản phẩm đầu ra bàn giao", "Tỷ lệ"]
for c_idx, h in enumerate(headers_wbs):
    style_cell(table_wbs.cell(0, c_idx), h, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, color=RGBColor(255, 255, 255), bg_color="1B365D")

wbs_data = [
    (
        "Nguyễn Trung Hiếu\n(HE180624)",
        "Giai đoạn 1: Khảo sát thực địa tại Phòng Kinh tế - Hạ tầng & Đô thị UBND Phường Hiệp Hòa; phân tích nghiệp vụ (BA) và chuẩn hóa cấu trúc dữ liệu hồ sơ địa chính, trích lục BĐĐC, thông tin quy hoạch.",
        "Tài liệu phân tích nghiệp vụ, Bộ 04 Schema trích xuất chuẩn hóa (Địa chính BĐĐC, Bìa sổ đỏ 2 mặt, Đơn hàng/Hóa đơn, Mẫu tùy chỉnh).",
        "25%"
    ),
    (
        "Nguyễn Trung Hiếu\n(HE180624)",
        "Giai đoạn 2: Thiết kế kiến trúc hệ thống 3 tầng; phát triển Backend FastAPI xử lý bất đồng bộ; tích hợp Google Gemini Multimodal API; xây dựng cơ chế Dynamic Model Fallback và Structured JSON Outputs.",
        "Module backend core (main.py, services/gemini_service.py), hệ thống RESTful API bóc tách dữ liệu tài liệu độ chính xác cao.",
        "30%"
    ),
    (
        "Nguyễn Trung Hiếu\n(HE180624)",
        "Giai đoạn 3: Phát triển giao diện Web Desktop đối soát song song (Split-Screen Review 50/50); phát triển module Mobile Scanner kết nối QR nội bộ qua mạng LAN; cơ chế tự động ghép 2 mặt sổ đỏ; Engine kết xuất Excel chuẩn hóa.",
        "Giao diện người dùng (static/index.html, app.js, mobile_connect.html), engine sinh bảng tính Excel tự động định dạng (services/excel_service.py).",
        "25%"
    ),
    (
        "Nguyễn Trung Hiếu\n(HE180624)",
        "Giai đoạn 4: Đóng gói phần mềm thành tệp thực thi Standalone DocuBatchAI.exe cho Windows; kiểm thử chất lượng (QA) trên 500 hồ sơ thực tế; đánh giá an toàn thông tin; tập huấn và bàn giao tại UBND Phường Hiệp Hòa.",
        "Tệp chạy độc lập DocuBatchAI.exe, báo cáo kiểm thử thực nghiệm, tài liệu hướng dẫn sử dụng 1 trang và báo cáo đề xuất sáng kiến.",
        "20%"
    )
]

for r_idx, row in enumerate(wbs_data):
    bg = "F9FBFC" if r_idx % 2 == 1 else "FFFFFF"
    for c_idx, val in enumerate(row):
        is_bold = True if c_idx == 0 else False
        align = WD_ALIGN_PARAGRAPH.CENTER if (c_idx == 0 or c_idx == 3) else WD_ALIGN_PARAGRAPH.LEFT
        style_cell(table_wbs.cell(r_idx + 1, c_idx), val, bold=is_bold, align=align, bg_color=bg)

# Cập nhật style cho tất cả các đoạn văn bản để font chữ Times New Roman hiển thị đồng nhất
for p in doc.paragraphs:
    for run in p.runs:
        run.font.name = "Times New Roman"

doc.save(file_path)
print("Đã cập nhật và điền trực tiếp thành công vào file:", file_path)
