@echo off
echo ============================================
echo   Criando package.json limpo do backend
echo ============================================

(
echo {
echo   "name": "backend",
echo   "version": "1.0.0",
echo   "main": "index.js",
echo   "type": "module",
echo   "scripts": {
echo     "start": "node index.js"
echo   },
echo   "dependencies": {
echo     "express": "^4.21.2",
echo     "cors": "^2.8.5",
echo     "dotenv": "^16.4.5",
echo     "mysql2": "^3.9.7",
echo     "jsonwebtoken": "^9.0.2",
echo     "bcryptjs": "^2.4.3",
echo     "zod": "^4.1.12",
echo     "drizzle-orm": "^0.44.5",
echo     "@trpc/server": "^11.6.0"
echo   }
echo }
) > backend\package.json

echo package.json do backend criado
pause