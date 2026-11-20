import os
import json
import uuid
import shutil
import sys
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from services.gemini_service import extract_document_data
from services.excel_service import generate_excel_file
from services.connect_service import connect_service
from services.project_chat_service import answer_project_question

if getattr(sys, "frozen", False):
    # Running in a PyInstaller bundle
    BUNDLE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
    STATIC_DIR = os.path.join(BUNDLE_DIR, "static")
    EXE_DIR = os.path.dirname(sys.executable)
    UPLOAD_DIR = os.path.join(EXE_DIR, "uploads")
    ENV_FILE = os.path.join(EXE_DIR, ".env")
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    STATIC_DIR = os.path.join(BASE_DIR, "static")
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    ENV_FILE = os.path.join(BASE_DIR, ".env")

if os.environ.get("VERCEL"):
    UPLOAD_DIR = os.path.join("/tmp", "docubatch-uploads")

load_dotenv(ENV_FILE)

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

class ProjectChatMessage(BaseModel):
    role: str = Field(max_length=16)
    content: str = Field(max_length=2000)

class ProjectChatRequest(BaseModel):
    message: str = Field(max_length=2000)
    history: List[ProjectChatMessage] = Field(default_factory=list, max_length=12)

@app.post("/api/project-chat")
async def project_chat(payload: ProjectChatRequest):
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="Chưa cấu hình GEMINI_API_KEY trên máy chủ.")
    message = payload.message.strip()
    if not message or len(message) > 2000:
        raise HTTPException(status_code=422, detail="Câu hỏi phải có từ 1 đến 2.000 ký tự.")
    history = [
        {"role": item.role, "content": item.content.strip()}
        for item in payload.history[-12:]
        if item.role in ("user", "model") and item.content.strip()
    ]
    try:
        answer = await answer_project_question(message, history, api_key)
        return {"answer": answer}
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

@app.get("/")
async def get_index():
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "DocuBatch API đang chạy. Vui lòng kiểm tra file static/index.html"}

@app.get("/api/land-notices")
async def get_land_notices():
    """Return notices explicitly published by the project operator."""
    notices_path = os.path.join(STATIC_DIR, "land_notices.json")
    try:
        with open(notices_path, "r", encoding="utf-8") as notices_file:
            data = json.load(notices_file)
    except FileNotFoundError:
        return {"updated_at": None, "notices": []}
    except (OSError, json.JSONDecodeError):
        raise HTTPException(status_code=503, detail="Không thể đọc danh sách thông báo đất đai.")

    if not isinstance(data, dict) or not isinstance(data.get("notices", []), list):
        raise HTTPException(status_code=503, detail="Dữ liệu thông báo đất đai không hợp lệ.")

    valid_notices = []
    for notice in data["notices"][:100]:
        if not isinstance(notice, dict):
            continue
        title = str(notice.get("title", "")).strip()[:200]
        content = str(notice.get("content", "")).strip()[:4000]
        if not title or not content:
            continue
        url = str(notice.get("url", "")).strip()[:1000]
        if url and not url.startswith(("https://", "http://")):
            url = ""
        valid_notices.append({
            "id": str(notice.get("id", ""))[:100],
            "title": title,
            "content": content,
            "region": str(notice.get("region", "Toàn quốc"))[:120],
            "date": str(notice.get("date", ""))[:40],
            "url": url,
        })
    return {"updated_at": data.get("updated_at"), "notices": valid_notices}

@app.get("/api/config")
async def get_config():
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    return {"gemini_api_key_configured": bool(api_key)}

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
    model: Optional[str] = Form(None)
):
    """
    Xử lý 1 file tài liệu: Lưu tạm, gửi sang Gemini AI để trích xuất theo Schema.
    """
    key_to_use = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key_to_use:
        raise HTTPException(
            status_code=400,
            detail="Chưa cấu hình Gemini API Key. Hãy thêm GEMINI_API_KEY vào file .env trên máy chủ."
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

@app.get("/connect")
async def get_connect_page():
    """
    Trang giao diện chụp và chuyển tài liệu di động cho điện thoại.
    """
    connect_path = os.path.join(STATIC_DIR, "mobile_connect.html")
    if os.path.exists(connect_path):
        return FileResponse(connect_path)
    raise HTTPException(status_code=404, detail="Không tìm thấy trang mobile_connect.html")

@app.get("/api/connect/info")
async def get_connect_info(request: Request):
    """
    Lấy thông tin mạng LAN & địa chỉ kết nối cho điện thoại.
    """
    host_header = request.headers.get("host", "")
    port = 8000
    if ":" in host_header:
        try:
            port = int(host_header.split(":")[-1])
        except Exception:
            pass

    local_ip = connect_service.get_local_ip()
    available_ips = connect_service.get_available_ips()

    client_host = host_header.split(":")[0] if host_header else "localhost"
    mobile_host = local_ip if (client_host in ["localhost", "127.0.0.1", "0.0.0.0"]) else client_host

    return {
        "local_ip": local_ip,
        "available_ips": available_ips,
        "port": port,
        "mobile_host": mobile_host,
        "connect_url": f"http://{mobile_host}:{port}/connect",
        "app_url": f"http://{mobile_host}:{port}/"
    }

@app.post("/api/connect/session/create")
async def create_connect_session(request: Request):
    """
    Khởi tạo phiên kết nối mới giữa PC và điện thoại.
    """
    session_id = connect_service.create_session()
    host_header = request.headers.get("host", "")
    port = 8000
    if ":" in host_header:
        try:
            port = int(host_header.split(":")[-1])
        except Exception:
            pass

    local_ip = connect_service.get_local_ip()
    available_ips = connect_service.get_available_ips()
    client_host = host_header.split(":")[0] if host_header else "localhost"
    mobile_host = local_ip if (client_host in ["localhost", "127.0.0.1", "0.0.0.0"]) else client_host

    connect_url = f"http://{mobile_host}:{port}/connect?session={session_id}"
    app_url = f"http://{mobile_host}:{port}/"

    return {
        "session_id": session_id,
        "connect_url": connect_url,
        "app_url": app_url,
        "local_ip": local_ip,
        "available_ips": available_ips,
        "port": port
    }

@app.get("/api/connect/session/{session_id}/status")
async def get_connect_session_status(session_id: str):
    """
    PC kiểm tra trạng thái kết nối và lấy danh sách tài liệu mới từ điện thoại.
    """
    session = connect_service.get_session(session_id)
    if not session:
        return {"exists": False, "connected": False, "new_files": [], "actions": [], "total_received": 0}

    connect_service.ping_pc(session_id)
    is_online = connect_service.is_phone_connected(session_id)
    new_files = connect_service.get_and_clear_pending_files(session_id)
    actions = connect_service.get_and_clear_actions(session_id)

    return {
        "exists": True,
        "connected": is_online,
        "phone_info": session.get("phone_info"),
        "new_files": new_files,
        "actions": actions,
        "total_received": len(session.get("uploaded_files_history", []))
    }

class PingPayload(BaseModel):
    client: Optional[str] = "phone"
    info: Optional[str] = None

@app.post("/api/connect/session/{session_id}/ping")
async def ping_connect_session(session_id: str, payload: Optional[PingPayload] = None):
    """
    Điện thoại gửi nhịp tim (heartbeat) để duy trì trạng thái kết nối.
    """
    info = payload.info if payload else None
    success = connect_service.ping_phone(session_id, client_info=info)
    return {"ok": success}

@app.post("/api/connect/session/{session_id}/upload")
async def upload_from_phone(
    session_id: str,
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None)
):
    """
    Điện thoại tải ảnh/PDF lên, lưu vào uploads và thông báo cho PC.
    """
    session = connect_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Phiên kết nối không tồn tại hoặc đã hết hạn.")
    if document_type not in (None, "land_cover"):
        raise HTTPException(status_code=400, detail="Loại tài liệu không được hỗ trợ.")

    filename = os.path.basename((file.filename or "phone_capture.jpg").replace("\\", "/"))
    ext = os.path.splitext(filename)[1].lower()
    if not ext:
        ext = ".jpg"
        filename += ext

    content_type = file.content_type or "image/jpeg"
    file_bytes = await file.read()

    safe_filename = f"{uuid.uuid4().hex}_{filename}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)
    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    file_info = {
        "file_id": safe_filename,
        "filename": filename,
        "file_url": f"/files/{safe_filename}",
        "content_type": content_type,
        "size": len(file_bytes)
    }
    if document_type:
        file_info["document_type"] = document_type

    connect_service.add_uploaded_file(session_id, file_info)

    return {
        "success": True,
        "file": file_info
    }

class ActionPayload(BaseModel):
    action: str
    data: Optional[Dict[str, Any]] = None

@app.post("/api/connect/session/{session_id}/action")
async def trigger_session_action(session_id: str, payload: ActionPayload):
    """
    Điện thoại gửi lệnh điều khiển sang PC (ví dụ: bắt đầu trích xuất AI).
    """
    ok = connect_service.add_action(session_id, payload.action, payload.data)
    return {"ok": ok}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
