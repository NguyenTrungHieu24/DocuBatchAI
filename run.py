import sys
import os
import multiprocessing
import threading
import webbrowser
import uvicorn

# Configure UTF-8 for console output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def open_browser():
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

if __name__ == "__main__":
    multiprocessing.freeze_support()

    local_ip = "127.0.0.1"
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass

    print("=====================================================")
    print(">> Khoi dong DocuBatch AI Server tai:")
    print(">> [May tinh]  : http://127.0.0.1:8000")
    print(f">> [Dien thoai]: http://{local_ip}:8000 (hoac quet ma QR)")
    print("=====================================================")

    is_frozen = getattr(sys, "frozen", False)
    if is_frozen:
        from main import app
        # Tu dong mo trinh duyet sau 1.2 giay khi chay file exe
        threading.Timer(1.2, open_browser).start()
        uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
    else:
        threading.Timer(1.2, open_browser).start()
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
