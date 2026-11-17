@echo off
chcp 65001 >nul
echo ===================================================
echo   DANG DONG GOI LAI DOCUBATCH AI (BUILD EXE)
echo ===================================================

echo [1/3] Kiem tra va tat tien trinh DocuBatchAI neu dang chay...
taskkill /F /IM DocuBatchAI.exe 2>nul

echo [2/3] Tien hanh build bang PyInstaller...
.\.venv\Scripts\python.exe -m PyInstaller --noconfirm packaging\DocuBatchAI.spec
if %ERRORLEVEL% NEQ 0 (
    echo [LOI] Qua trinh dong goi gap loi!
    pause
    exit /b %ERRORLEVEL%
)

echo [3/3] Chep file exe moi ra thu muc goc...
copy /Y "dist\DocuBatchAI.exe" "DocuBatchAI.exe"

echo ===================================================
echo   HOAN TAT! File DocuBatchAI.exe da duoc cap nhat.
echo ===================================================
pause
