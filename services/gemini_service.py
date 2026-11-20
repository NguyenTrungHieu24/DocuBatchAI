import base64
import json
import os
import httpx
from typing import Dict, Any, List, Optional

# Cache các model hỗ trợ generateContent cho từng API key
_CACHED_MODELS: Dict[str, List[str]] = {}

# Danh sách model ưu tiên theo thứ tự từ nhanh & ổn định nhất đến các bản fallback
PREFERRED_MODELS = [
    "gemini-3.8-flash",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemini-flash-latest"
]

# Các từ khóa của model không dùng cho trích xuất văn bản/tài liệu (TTS, Audio, Image Generation, v.v.)
EXCLUDED_MODEL_KEYWORDS = [
    "tts", "transcribe", "clip", "robotics", "image",
    "preview-tts", "embedding", "customtools"
]

async def get_available_models(client: httpx.AsyncClient, api_key: str) -> List[str]:
    """
    Truy vấn danh sách model thực tế được hỗ trợ bởi API Key của người dùng.
    Lọc bỏ các model TTS / Audio / Image-generation không phù hợp cho đọc tài liệu.
    """
    if api_key in _CACHED_MODELS and _CACHED_MODELS[api_key]:
        return _CACHED_MODELS[api_key]

    for api_ver in ["v1beta", "v1"]:
        try:
            url = f"https://generativelanguage.googleapis.com/{api_ver}/models?key={api_key}"
            res = await client.get(url, timeout=8.0)
            if res.status_code == 200:
                data = res.json()
                models_list = data.get("models", [])
                valid_models = []
                for m in models_list:
                    name = m.get("name", "").replace("models/", "")
                    methods = m.get("supportedGenerationMethods", [])
                    if "generateContent" in methods:
                        # Bỏ qua các model chuyên biệt âm thanh, tts, v.v.
                        if any(kw in name.lower() for kw in EXCLUDED_MODEL_KEYWORDS):
                            continue
                        valid_models.append(name)

                if valid_models:
                    _CACHED_MODELS[api_key] = valid_models
                    return valid_models
        except Exception:
            pass

    return PREFERRED_MODELS

async def extract_document_data(
    file_bytes: bytes,
    mime_type: str,
    schema_fields: List[Dict[str, str]],
    api_key: str,
    model_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Gửi file tài liệu (PDF, Ảnh) và danh sách trường cần trích xuất đến Gemini API.
    Sử dụng structured output và cơ chế fallback model tự động để không bao giờ bị lỗi.
    """
    if not api_key:
        raise ValueError("Chưa cung cấp Gemini API Key. Vui lòng cấu hình GEMINI_API_KEY trong file .env.")

    # Mã hoá file thành Base64
    b64_data = base64.b64encode(file_bytes).decode("utf-8")

    # Xây dựng schema JSON yêu cầu
    item_properties = {}
    for field in schema_fields:
        field_id = field.get("id", "")
        field_desc = field.get("description", field.get("label", ""))
        item_properties[field_id] = {
            "type": "string",
            "description": field_desc
        }

    fields_instruction = "\n".join([
        f"- {f.get('id')}: {f.get('label')} ({f.get('description', '')})"
        for f in schema_fields
    ])

    system_instruction = (
        "Bạn là chuyên gia trích xuất dữ liệu tài liệu hàng đầu. "
        "Nhiệm vụ của bạn là đọc kỹ tài liệu được cung cấp (hóa đơn, chứng từ, đơn đăng ký đất đai, bản đồ địa chính, hợp đồng, biểu mẫu,...) "
        "và trích xuất chính xác toàn bộ các dòng thông tin được yêu cầu dưới dạng JSON chuẩn.\n"
        "QUY TẮC CỰC KỲ QUAN TRỌNG VỀ ĐA DÒNG DỮ LIỆU:\n"
        "1. Nếu tài liệu chứa một danh sách, bảng dữ liệu gồm NHIỀU HÀNG/DÒNG (ví dụ STT 1, 2, 3, 4, 5... hoặc nhiều đối tượng/khoản mục), "
        "bạn BẮT BUỘC phải duyệt qua từng dòng một và trích xuất TẤT CẢ các dòng đó vào mảng `items`. Tuyệt đối không được chỉ lấy dòng đầu tiên hoặc bỏ sót bất kỳ dòng nào!\n"
        "2. Nếu tài liệu chỉ là một văn bản đơn lẻ (1 đơn đăng ký, 1 hóa đơn), mảng `items` sẽ có 1 phần tử tương ứng.\n"
        "3. Nếu một trường không tìm thấy trong tài liệu hoặc dòng tương ứng, hãy để chuỗi rỗng \"\" hoặc \"N/A\", không tự ý bịa đặt thông tin."
    )

    prompt_text = (
        f"Hãy đọc kỹ tài liệu đính kèm và trích xuất TOÀN BỘ các dòng dữ liệu (mỗi dòng STT / hàng trong bảng là 1 phần tử riêng trong mảng 'items') theo các trường sau:\n{fields_instruction}\n\n"
        "Lưu ý: BẮT BUỘC phải trích xuất HẾT tất cả các dòng dữ liệu có trong tài liệu, không bỏ sót dòng nào. Yêu cầu trả về đúng định dạng JSON tuân thủ schema."
    )

    json_schema = {
        "type": "object",
        "properties": {
            "_ai_summary": {
                "type": "string",
                "description": "Tóm tắt ngắn gọn 1-2 câu về nội dung chính của tài liệu"
            },
            "_confidence_score": {
                "type": "number",
                "description": "Độ rõ nét và mức độ tự tin của dữ liệu đọc được từ 0.0 đến 1.0"
            },
            "items": {
                "type": "array",
                "description": (
                    "Danh sách TẤT CẢ các dòng dữ liệu/bản ghi trích xuất từ tài liệu. "
                    "Nếu tài liệu có nhiều hàng, dòng STT hoặc bảng danh sách (ví dụ STT 1, 2, 3, 4...), "
                    "bạn BẮT BUỘC phải trích xuất ĐẦY ĐỦ TẤT CẢ các dòng thành từng phần tử trong mảng items này. "
                    "Nếu tài liệu chỉ là 1 bản ghi đơn lẻ, mảng items chứa 1 phần tử."
                ),
                "items": {
                    "type": "object",
                    "properties": item_properties,
                    "required": [f["id"] for f in schema_fields]
                }
            }
        },
        "required": ["items"]
    }

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_data
                        }
                    },
                    {
                        "text": prompt_text
                    }
                ]
            }
        ],
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": json_schema,
            "temperature": 0.1
        }
    }

    headers = {
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient(timeout=45.0) as client:
        # Lấy danh sách các model hợp lệ khả dụng
        available_models = await get_available_models(client, api_key)

        candidate_models = []
        # Nếu người dùng chỉ định cụ thể một model hợp lệ khác 'auto'
        if model_name and model_name != "auto" and model_name in available_models:
            candidate_models.append(model_name)

        # Ưu tiên các model trong PREFERRED_MODELS có trong available_models
        for pref in PREFERRED_MODELS:
            if pref in available_models and pref not in candidate_models:
                candidate_models.append(pref)

        # Thêm các model còn lại nếu chưa có
        for m in available_models:
            if m not in candidate_models:
                candidate_models.append(m)

        if not candidate_models:
            candidate_models = PREFERRED_MODELS

        last_error = None
        for m in candidate_models:
            # Ưu tiên v1beta vì đây là endpoint hỗ trợ responseSchema và các model mới nhất
            for api_ver in ["v1beta", "v1"]:
                url = f"https://generativelanguage.googleapis.com/{api_ver}/models/{m}:generateContent?key={api_key}"
                try:
                    response = await client.post(url, json=payload, headers=headers)
                    if response.status_code == 200:
                        resp_data = response.json()
                        candidates = resp_data.get("candidates", [])
                        if not candidates:
                            last_error = f"Model {m} không trả về candidates."
                            continue

                        text_content = candidates[0]["content"]["parts"][0]["text"]
                        parsed_json = json.loads(text_content)
                        if not isinstance(parsed_json, dict):
                            if isinstance(parsed_json, list):
                                parsed_json = {"items": parsed_json, "_ai_summary": "Danh sách dữ liệu trích xuất"}
                            else:
                                parsed_json = {"items": [], "_ai_summary": ""}
                        if "items" not in parsed_json:
                            flat_item = {k: v for k, v in parsed_json.items() if not k.startswith("_")}
                            parsed_json["items"] = [flat_item] if flat_item else []
                        return parsed_json
                    elif response.status_code in (404, 503, 429, 500, 400):
                        # Gặp 404 (model không hỗ trợ endpoint/deprecated) hoặc 503 (quá tải) -> Thử model tiếp theo ngay lập tức
                        err_text = response.text[:200]
                        last_error = f"Model {m} ({api_ver}) [{response.status_code}]: {err_text}"
                        continue
                    else:
                        last_error = f"Gemini API [{m} - {response.status_code}]: {response.text[:200]}"
                        continue
                except Exception as e:
                    if isinstance(e, (httpx.ConnectError, httpx.TimeoutException)):
                        last_error = f"Timeout hoặc mất kết nối khi gọi model {m}: {str(e)}"
                    else:
                        last_error = str(e)
                    continue

        raise RuntimeError(f"Trích xuất thất bại: {last_error}")
