import os
import json
import uuid
import shutil
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.gemini_service import extract_document_data
from services.excel_service import generate_excel_file

import sys

if getattr(sys, "frozen", False):
    # Running in a PyInstaller bundle
    BUNDLE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    STATIC_DIR = os.path.join(BUNDLE_DIR, "static")
    EXE_DIR = os.path.dirname(sys.executable)
    UPLOAD_DIR = os.path.join(EXE_DIR, "uploads")
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    STATIC_DIR = os.path.join(BASE_DIR, "static")
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)

app = FastAPI(title="DocuBatch AI", description="Công cụ trích xuất và xử lý tài liệu thông minh hàng loạt")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phục vụ file tĩnh (CSS, JS, Assets)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def get_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "DocuBatch API đang chạy. Vui lòng kiểm tra file static/index.html"}

@app.get("/files/{file_id}")
async def get_uploaded_file(file_id: str):
    # Never allow a requested file ID to escape the uploads directory.
    safe_file_id = os.path.basename(file_id)
    upload_root = os.path.realpath(UPLOAD_DIR)
    file_path = os.path.realpath(os.path.join(upload_root, safe_file_id))
    if (
        safe_file_id != file_id
        or os.path.commonpath([upload_root, file_path]) != upload_root
        or not os.path.isfile(file_path)
    ):
        raise HTTPException(status_code=404, detail="Không tìm thấy tệp")
    return FileResponse(file_path)

@app.post("/api/extract")
async def extract_file(
    file: UploadFile = File(...),
    schema_data: str = Form(..., alias="schema_json"),
    api_key: Optional[str] = Form(None),
    model: Optional[str] = Form(None),
    x_gemini_key: Optional[str] = Header(None)
):
    """
    Xử lý 1 file tài liệu: Lưu tạm, gửi sang Gemini AI để trích xuất theo Schema.
    """
    key_to_use = api_key or x_gemini_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key_to_use:
        raise HTTPException(
            status_code=400,
            detail="Thiếu Gemini API Key. Vui lòng bấm Cài đặt trên góc phải để nhập API Key của bạn."
        )

    try:
        schema = json.loads(schema_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Schema JSON không hợp lệ.")

    # Xác định mime_type
    content_type = file.content_type
    # Client filenames are untrusted; discard any supplied directory path.
    filename = os.path.basename((file.filename or "unknown").replace("\\", "/"))
    ext = os.path.splitext(filename)[1].lower()

    if not content_type or content_type == "application/octet-stream":
        if ext == ".pdf":
            content_type = "application/pdf"
        elif ext in [".jpg", ".jpeg"]:
            content_type = "image/jpeg"
        elif ext == ".png":
            content_type = "image/png"
        elif ext == ".webp":
            content_type = "image/webp"
        else:
            raise HTTPException(status_code=400, detail=f"Định dạng tệp '{ext}' chưa được hỗ trợ. Hãy dùng PDF, PNG, JPG.")

    # Đọc bytes
    file_bytes = await file.read()

    # Lưu tạm vào thư mục uploads với uuid
    safe_filename = f"{uuid.uuid4().hex}_{filename}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Gọi AI trích xuất
    try:
        extracted_result = await extract_document_data(
            file_bytes=file_bytes,
            mime_type=content_type,
            schema_fields=schema.get("fields", []),
            api_key=key_to_use,
            model_name=model
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "file_id": safe_filename,
                "filename": filename
            }
        )
    return {
        "success": True,
        "file_id": safe_filename,
        "filename": filename,
        "content_type": content_type,
        "file_url": f"/files/{safe_filename}",
        "extracted_data": extracted_result
    }

class ExportRequest(BaseModel):
    records: list
    schema_fields: list

@app.post("/api/export/excel")
async def export_to_excel(payload: ExportRequest):
    """
    Xuất danh sách các tài liệu đã trích xuất ra file Excel.
    """
    try:
        excel_buffer = generate_excel_file(payload.records, payload.schema_fields)
        return StreamingResponse(
            excel_buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=DocuBatch_Export.xlsx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo file Excel: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
