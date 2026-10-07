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

    print("=====================================================")
    print(">> Khoi dong DocuBatch AI Server tai:")
    print(">> http://127.0.0.1:8000")
    print("=====================================================")

    is_frozen = getattr(sys, "frozen", False)
    if is_frozen:
        from main import app
        # Tu dong mo trinh duyet sau 1.2 giay khi chay file exe
        threading.Timer(1.2, open_browser).start()
        uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
    else:
        threading.Timer(1.2, open_browser).start()
        uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
