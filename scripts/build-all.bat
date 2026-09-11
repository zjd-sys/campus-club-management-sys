@echo off
REM =============================================================
REM Production build (Windows)
REM   - backend : Maven package -> backend\target\campus-club-backend.jar
REM   - frontend: Vite build    -> portal-web\dist, admin-web\dist
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
echo     artifact: backend\target\campus-club-backend.jar

echo ==^> [2/3] Building portal frontend ...
pushd portal-web
if not exist node_modules call npm install
call npm run build
if errorlevel 1 ( echo Portal build FAILED & popd & popd & exit /b 1 )
popd
echo     artifact: portal-web\dist

echo ==^> [3/3] Building admin frontend ...
pushd admin-web
if not exist node_modules call npm install
call npm run build
if errorlevel 1 ( echo Admin build FAILED & popd & popd & exit /b 1 )
popd
echo     artifact: admin-web\dist

echo.
echo Build finished. Run scripts\start-prod.bat to start.
popd
endlocal
