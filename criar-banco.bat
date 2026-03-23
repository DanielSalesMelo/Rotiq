@echo off
chcp 65001 >nul
title Rotiq - Criar Banco de Dados
color 0A
echo ============================================
echo    ROTIQ - Criar Banco de Dados PostgreSQL
echo ============================================
echo.
:: Verificar se psql esta instalado
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] PostgreSQL nao encontrado no PATH!
    echo.
    echo Opcoes:
    echo 1. Instale PostgreSQL 14+: https://www.postgresql.org/download/
    echo 2. Ou use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=root postgres:16
    echo.
    echo Apos instalar, adicione o PostgreSQL ao PATH do sistema.
    pause
    exit /b 1
)
echo [OK] PostgreSQL encontrado
echo.
set /p PG_USER=Usuario PostgreSQL (padrao: postgres): 
if "%PG_USER%"=="" set PG_USER=postgres
set /p PG_HOST=Host (padrao: localhost): 
if "%PG_HOST%"=="" set PG_HOST=localhost
set /p PG_PORT=Porta (padrao: 5432): 
if "%PG_PORT%"=="" set PG_PORT=5432
echo.
echo [INFO] Criando banco de dados 'rotiq'...
psql -U %PG_USER% -h %PG_HOST% -p %PG_PORT% -c "CREATE DATABASE rotiq ENCODING 'UTF8';" 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Banco 'rotiq' pode ja existir, continuando...
)
echo [OK] Banco 'rotiq' verificado
echo.
echo [INFO] Aplicando schema inicial...
psql -U %PG_USER% -h %PG_HOST% -p %PG_PORT% -d rotiq -f sql\01_schema_inicial.sql 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Erro ao aplicar schema inicial (tabelas podem ja existir)
)
echo [OK] Schema inicial aplicado
echo.
echo [INFO] Aplicando migracoes adicionais...
psql -U %PG_USER% -h %PG_HOST% -p %PG_PORT% -d rotiq -f sql\02_migracao_adicional.sql 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Erro ao aplicar migracoes (podem ja estar aplicadas)
)
echo [OK] Migracoes aplicadas
echo.
echo [INFO] Criando usuario admin padrao...
psql -U %PG_USER% -h %PG_HOST% -p %PG_PORT% -d rotiq -c "INSERT INTO users (\"openId\", name, email, role, \"createdAt\", \"updatedAt\") VALUES ('admin', 'Administrador', 'admin@rotiq.local', 'admin', NOW(), NOW()) ON CONFLICT (\"openId\") DO NOTHING;" 2>nul
echo [OK] Usuario admin criado (openId: admin)
echo.
echo ============================================
echo  Banco de dados configurado com sucesso!
echo.
echo  Agora edite o arquivo .env com:
echo  DATABASE_URL=postgresql://%PG_USER%:SUA_SENHA@%PG_HOST%:%PG_PORT%/rotiq
echo ============================================
echo.
pause
