@echo off
REM =============================================================
REM Start local dev environment (Windows)
REM   - backend : Spring Boot, H2 in-memory + demo data, port 8080
REM   - portal  : Vite dev server, port 5173
REM   - admin   : Vite dev server, port 5174
REM Requires: JDK 17+, Maven 3.8+, Node.js 18+
REM =============================================================
setlocal
set ROOT=%~dp0..
pushd "%ROOT%"

echo ==^> [1/3] Building backend ...
pushd backend
call mvn -q -DskipTests package
if errorlevel 1 ( echo Backend build FAILED & popd & popd & exit /b 1 )
popd

echo ==^> [2/3] Starting backend on :8080 ...
start "campus-backend" cmd /c "java -jar backend\target\campus-club-backend.jar --server.port=8080"

echo ==^> [3/3] Starting frontend dev servers ...
pushd portal-web
if not exist node_modules call npm install
popd
start "campus-portal" cmd /c "cd /d %ROOT%\portal-web && npm run dev"

pushd admin-web
if not exist node_modules call npm install
popd
start "campus-admin" cmd /c "cd /d %ROOT%\admin-web && npm run dev"

echo.
echo Portal: http://localhost:5173
echo Admin : http://localhost:5174
echo API   : http://localhost:8080/api/portal/clubs
echo.
echo Default accounts (password 123456):
echo   admin / admin123 (super admin token)   student (Zhang San)
echo   teacher (Ms. Wang)                     sunqi (Sun Qi)
popd
endlocal
