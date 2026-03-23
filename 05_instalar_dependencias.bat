@echo off
echo Instalando dependencias do backend...
cd backend
pnpm install
cd ..

echo Instalando dependencias do frontend...
cd client
pnpm install
cd ..

echo Tudo instalado com sucesso!
pause