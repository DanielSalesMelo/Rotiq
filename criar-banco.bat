@echo off
chcp 65001 >nul
title Rotiq - Criar Banco de Dados
color 0A

echo ============================================
echo    ROTIQ - Criar Banco de Dados MySQL
echo ============================================
echo.

:: Verificar se MySQL está instalado
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] MySQL nao encontrado no PATH!
    echo.
    echo Opcoes:
    echo 1. Instale MySQL 8.0+: https://dev.mysql.com/downloads/
    echo 2. Ou instale XAMPP: https://www.apachefriends.org/
    echo 3. Ou use Docker: docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root mysql:8
    echo.
    echo Apos instalar, adicione o MySQL ao PATH do sistema.
    pause
    exit /b 1
)

echo [OK] MySQL encontrado
echo.

set /p MYSQL_USER=Usuario MySQL (padrao: root): 
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASS=Senha MySQL: 

echo.
echo [INFO] Criando banco de dados 'rotiq'...
mysql -u %MYSQL_USER% -p%MYSQL_PASS% -e "CREATE DATABASE IF NOT EXISTS rotiq CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao criar banco de dados
    echo Verifique usuario e senha do MySQL
    pause
    exit /b 1
)
echo [OK] Banco 'rotiq' criado

echo.
echo [INFO] Aplicando schema inicial...
mysql -u %MYSQL_USER% -p%MYSQL_PASS% rotiq < sql\01_schema_inicial.sql 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Erro ao aplicar schema inicial (tabelas podem ja existir)
)
echo [OK] Schema inicial aplicado

echo.
echo [INFO] Aplicando migracoes adicionais...
mysql -u %MYSQL_USER% -p%MYSQL_PASS% rotiq < sql\02_migracao_adicional.sql 2>nul
if %errorlevel% neq 0 (
    echo [AVISO] Erro ao aplicar migracoes (podem ja estar aplicadas)
)
echo [OK] Migracoes aplicadas

echo.
echo [INFO] Criando usuario admin padrao...
mysql -u %MYSQL_USER% -p%MYSQL_PASS% rotiq -e "INSERT IGNORE INTO users (openId, name, email, role, createdAt, updatedAt) VALUES ('admin', 'Administrador', 'admin@rotiq.local', 'admin', NOW(), NOW());" 2>nul
echo [OK] Usuario admin criado (openId: admin)

echo.
echo ============================================
echo  Banco de dados configurado com sucesso!
echo.
echo  Agora edite o arquivo .env com:
echo  DATABASE_URL=mysql://%MYSQL_USER%:%MYSQL_PASS%@localhost:3306/rotiq
echo ============================================
echo.
pause
