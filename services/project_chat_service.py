import httpx


async def answer_project_question(
    message: str,
    api_key: str,
    base_url: str,
    user_id: str,
    conversation_id: str = "",
) -> dict:
    payload = {
        "inputs": {},
        "query": message,
        "response_mode": "blocking",
        "user": user_id,
    }
    if conversation_id:
        payload["conversation_id"] = conversation_id

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{base_url.rstrip('/')}/chat-messages",
                headers={"Authorization": f"Bearer {api_key}"},
                json=payload,
            )
        if response.status_code != 200:
            raise RuntimeError(f"Dify API trả về mã {response.status_code}.")
        result = response.json()
        answer = result.get("answer", "").strip()
        if not answer:
            raise RuntimeError("Dify không trả về câu trả lời. Kiểm tra ứng dụng Dify đã được xuất bản chưa.")
        return {"answer": answer, "conversation_id": result.get("conversation_id", "")}
    except httpx.TimeoutException as exc:
        raise RuntimeError("Kết nối Dify hết thời gian chờ.") from exc
    except httpx.HTTPError as exc:
        raise RuntimeError("Không thể kết nối Dify API. Kiểm tra DIFY_API_BASE_URL.") from exc
