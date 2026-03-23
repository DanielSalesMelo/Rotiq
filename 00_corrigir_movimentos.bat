@echo off
echo ============================================
echo   Corrigindo movimentos errados do BAT 2
echo ============================================

REM garante que as pastas existem
mkdir backend
mkdir frontend

echo.
echo Movendo arquivos que pertencem ao backend de volta para /backend...
echo.

REM move arquivos típicos do backend
if exist "frontend\_core" move /Y "frontend\_core" "backend\"
if exist "frontend\helpers" move /Y "frontend\helpers" "backend\"
if exist "frontend\routers" move /Y "frontend\routers" "backend\"
if exist "frontend\index.js" move /Y "frontend\index.js" "backend\"
if exist "frontend\src" move /Y "frontend\src" "backend\"

echo.
echo Movendo arquivos que pertencem ao frontend de volta para /frontend...
echo.

REM move arquivos típicos do frontend
if exist "src" move /Y "src" "frontend\"
if exist "vite.config.*" move /Y "vite.config.*" "frontend\"
if exist "tailwind.config.*" move /Y "tailwind.config.*" "frontend\"
if exist "postcss.config.*" move /Y "postcss.config.*" "frontend\"
if exist "index.html" move /Y "index.html" "frontend\"

echo.
echo ============================================
echo   Correção concluída!
echo   Agora rode novamente o BAT 3
echo ============================================
pause