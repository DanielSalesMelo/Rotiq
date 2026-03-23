@echo off
echo ============================================
echo   Movendo backend da pasta /server para raiz
echo ============================================
echo.

REM Verifica se a pasta server existe
if not exist "server" (
    echo ERRO: A pasta "server" nao existe no local atual.
    echo Execute este script dentro da pasta Rotiq.
    pause
    exit /b
)

REM Move package.json
if exist "server\package.json" (
    move /Y "server\package.json" "package.json"
    echo package.json movido.
)

REM Move pnpm-lock.yaml
if exist "server\pnpm-lock.yaml" (
    move /Y "server\pnpm-lock.yaml" "pnpm-lock.yaml"
    echo pnpm-lock.yaml movido.
)

REM Move index.js
if exist "server\index.js" (
    move /Y "server\index.js" "index.js"
    echo index.js movido.
)

REM Move src/
if exist "server\src" (
    move /Y "server\src" "src"
    echo Pasta src movida.
)

REM Move qualquer outra pasta importante
for %%F in (_core helpers routers db storage) do (
    if exist "server\%%F" (
        move /Y "server\%%F" "%%F"
        echo Pasta %%F movida.
    )
)

echo.
echo ============================================
echo   Movido com sucesso!
echo   Agora voce pode deletar a pasta /server
echo   e rodar: git add . && git commit && git push
echo ============================================
pause