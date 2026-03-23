@echo off
echo ============================================
echo   Criando pasta /backend e movendo backend
echo ============================================

REM cria pasta backend
mkdir backend

REM move pastas do backend
move /Y "_core" "backend\"
move /Y "helpers" "backend\"
move /Y "routers" "backend\"
move /Y "index.js" "backend\"

echo Backend movido para /backend
pause