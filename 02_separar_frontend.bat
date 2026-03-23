@echo off
echo ============================================
echo   Criando pasta /frontend e movendo frontend
echo ============================================

mkdir frontend

REM move arquivos típicos de frontend
move /Y "src" "frontend\"
move /Y "vite.config.*" "frontend\"
move /Y "tailwind.config.*" "frontend\"
move /Y "postcss.config.*" "frontend\"
move /Y "index.html" "frontend\"

echo Frontend movido para /frontend
pause