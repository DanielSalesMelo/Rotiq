@echo off
echo ============================================
echo   Criando package.json limpo do frontend
echo ============================================

(
echo {
echo   "name": "frontend",
echo   "version": "1.0.0",
echo   "private": true,
echo   "scripts": {
echo     "dev": "vite",
echo     "build": "vite build",
echo     "preview": "vite preview"
echo   },
echo   "dependencies": {
echo     "react": "^19.2.1",
echo     "react-dom": "^19.2.1",
echo     "@tanstack/react-query": "^5.90.2",
echo     "@trpc/client": "^11.6.0",
echo     "@trpc/react-query": "^11.6.0",
echo     "axios": "^1.12.0",
echo     "zod": "^4.1.12"
echo   },
echo   "devDependencies": {
echo     "vite": "^7.1.7",
echo     "@vitejs/plugin-react": "^5.0.4",
echo     "tailwindcss": "^4.1.14",
echo     "postcss": "^8.4.47",
echo     "autoprefixer": "^10.4.20"
echo   }
echo }
) > client\package.json

echo package.json do frontend criado em /client
pause