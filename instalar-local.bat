@echo off
chcp 65001 >nul
title Rotiq - Instalação Local
color 0A

echo ============================================
echo    ROTIQ - Sistema de Gestão de Frotas
echo    Instalação Local para Windows
echo ============================================
echo.

:: Verificar se Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao encontrado!
    echo Baixe e instale em: https://nodejs.org/
    echo Versao recomendada: 22 LTS
    pause
    exit /b 1
)

:: Verificar versão do Node
for /f "tokens=1 delims=v" %%a in ('node -v') do set NODE_VER=%%a
echo [OK] Node.js encontrado: v%NODE_VER%

:: Verificar se pnpm está instalado
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] pnpm nao encontrado. Instalando...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar pnpm
        pause
        exit /b 1
    )
)
echo [OK] pnpm encontrado

:: Verificar se .env existe
if not exist ".env" (
    echo.
    echo [AVISO] Arquivo .env nao encontrado!
    echo Copiando .env.exemplo para .env...
    copy .env.exemplo .env
    echo.
    echo ============================================
    echo  IMPORTANTE: Edite o arquivo .env com suas
    echo  credenciais antes de iniciar o sistema!
    echo ============================================
    echo.
    notepad .env
    pause
)

:: Instalar dependências
echo.
echo [INFO] Instalando dependencias...
call pnpm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas

echo.
echo ============================================
echo  Instalacao concluida com sucesso!
echo  Execute "iniciar.bat" para iniciar o sistema
echo ============================================
echo.
pause
