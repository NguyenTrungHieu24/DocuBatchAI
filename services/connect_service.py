import os
import time
import socket
import uuid
from typing import Dict, List, Optional, Any

class ConnectService:
    def __init__(self):
        # In-memory session store: session_id -> session data
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def get_local_ip(self) -> str:
        """
        Lấy địa chỉ IPv4 LAN chính của máy tính.
        """
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # Kết nối tới IP public bất kỳ (không gửi gói tin thực tế) để xác định interface mạng đang dùng
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
        except Exception:
            try:
                ip = socket.gethostbyname(socket.gethostname())
            except Exception:
                ip = "127.0.0.1"
        finally:
            s.close()
        return ip

    def get_available_ips(self) -> List[str]:
        """
        Lấy danh sách tất cả các địa chỉ IPv4 LAN khả dụng trên máy.
        """
        ips = []
        primary_ip = self.get_local_ip()
        if primary_ip and not primary_ip.startswith("127."):
            ips.append(primary_ip)

        try:
            hostname = socket.gethostname()
            for ip in socket.gethostbyname_ex(hostname)[2]:
                if ip not in ips and not ip.startswith("127."):
                    ips.append(ip)
        except Exception:
            pass

        if not ips:
            ips.append("127.0.0.1")
        return ips

    def create_session(self) -> str:
        """
        Tạo một phiên kết nối mới giữa PC và Điện thoại.
        """
        self.clean_expired_sessions()
        session_id = f"sess_{uuid.uuid4().hex[:10]}"
        now = time.time()
        self.sessions[session_id] = {
            "id": session_id,
            "created_at": now,
            "last_seen_pc": now,
            "last_seen_phone": None,
            "phone_info": None,
            "pending_files": [],
            "uploaded_files_history": [],
            "pending_actions": []
        }
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        return self.sessions.get(session_id)

    def ping_pc(self, session_id: str) -> bool:
        session = self.get_session(session_id)
        if not session:
            return False
        session["last_seen_pc"] = time.time()
        return True

    def ping_phone(self, session_id: str, client_info: Optional[str] = None) -> bool:
        session = self.get_session(session_id)
        if not session:
            return False
        session["last_seen_phone"] = time.time()
        if client_info:
            session["phone_info"] = client_info
        return True

    def is_phone_connected(self, session_id: str) -> bool:
        session = self.get_session(session_id)
        if not session or not session.get("last_seen_phone"):
            return False
        # Nếu điện thoại đã ping trong vòng 15 giây thì tính là đang online
        return (time.time() - session["last_seen_phone"]) < 15.0

    def add_uploaded_file(self, session_id: str, file_info: Dict[str, Any]) -> bool:
        session = self.get_session(session_id)
        if not session:
            return False
        file_info["uploaded_at"] = time.time()
        session["pending_files"].append(file_info)
        session["uploaded_files_history"].append(file_info)
        session["last_seen_phone"] = time.time()
        return True

    def get_and_clear_pending_files(self, session_id: str) -> List[Dict[str, Any]]:
        session = self.get_session(session_id)
        if not session:
            return []
        session["last_seen_pc"] = time.time()
        files = list(session["pending_files"])
        session["pending_files"].clear()
        return files

    def add_action(self, session_id: str, action: str, data: Optional[Dict[str, Any]] = None) -> bool:
        session = self.get_session(session_id)
        if not session:
            return False
        session["pending_actions"].append({
            "action": action,
            "data": data or {},
            "timestamp": time.time()
        })
        return True

    def get_and_clear_actions(self, session_id: str) -> List[Dict[str, Any]]:
        session = self.get_session(session_id)
        if not session:
            return []
        actions = list(session["pending_actions"])
        session["pending_actions"].clear()
        return actions

    def clean_expired_sessions(self, max_age_seconds: float = 7200):
        """
        Xóa các session cũ quá 2 tiếng không hoạt động.
        """
        now = time.time()
        expired = [
            sid for sid, data in self.sessions.items()
            if (now - max(data["last_seen_pc"], data.get("last_seen_phone") or 0)) > max_age_seconds
        ]
        for sid in expired:
            self.sessions.pop(sid, None)

# Global singleton
connect_service = ConnectService()
