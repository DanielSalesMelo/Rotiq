@echo off
echo ============================================
echo   Limpando raiz e preparando deploy
echo ============================================

del package.json
del pnpm-lock.yaml
del index.js

echo Raiz limpa. Agora:
echo 1. git add .
echo 2. git commit -m "refactor: separar frontend e backend"
echo 3. git push
pause