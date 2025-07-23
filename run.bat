@echo off
title تشغيل نظام المخزون

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo ❌ Node.js غير مثبت. حمّله من https://nodejs.org
  timeout /t 5
  exit /b
)

if not exist "node_modules" (
  echo 🚀 جاري تثبيت الحزم...
  npm install
)

:: تشغيل السيرفر والخلفية
start "" /min cmd /c "npm start"

timeout /t 2 >nul
start "" "http://localhost:3000"

exit /b
