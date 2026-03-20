@echo off
chcp 65001 >nul
title Rotiq - Sistema de Gestão de Frotas
color 0A

echo ============================================
echo    ROTIQ - Sistema de Gestão de Frotas
echo    Iniciando servidor local...
echo ============================================
echo.

:: Verificar se .env existe
if not exist ".env" (
    echo [ERRO] Arquivo .env nao encontrado!
    echo Execute "instalar-local.bat" primeiro.
    pause
    exit /b 1
)

:: Verificar se node_modules existe
if not exist "node_modules" (
    echo [ERRO] Dependencias nao instaladas!
    echo Execute "instalar-local.bat" primeiro.
    pause
    exit /b 1
)

echo [INFO] Iniciando servidor de desenvolvimento...
echo [INFO] O sistema abrira no navegador automaticamente.
echo [INFO] Pressione Ctrl+C para parar o servidor.
echo.
echo ============================================
echo  Acesse: http://localhost:3000
echo ============================================
echo.

:: Abrir navegador automaticamente
start http://localhost:3000

:: Iniciar servidor
call pnpm dev

pause
