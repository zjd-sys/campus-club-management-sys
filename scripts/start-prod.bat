@echo off
REM =============================================================
REM Start production backend (Windows)
REM   - runs backend jar (default profile: mysql; override with PROFILE env)
REM   - serve portal-web\dist and admin-web\dist via Nginx
REM Environment variables (all optional, secure defaults):
REM   PROFILE=mysql | dev        server port: SERVER_PORT=8080
REM   DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD
REM   STORAGE_TYPE=local|minio   STORAGE_LOCAL_PATH=.\uploads
REM   JWT_SECRET / ADMIN_SECRET  APP_CORS_ALLOWED_ORIGINS
REM =============================================================
setlocal
set ROOT=%~dp0..
pushd "%ROOT%"

set JAR=backend\target\campus-club-backend.jar
if not exist "%JAR%" (
  echo Jar not found: %JAR%
  echo Please run scripts\build-all.bat first.
  popd & exit /b 1
)

if "%PROFILE%"=="" set PROFILE=mysql
if "%SERVER_PORT%"=="" set SERVER_PORT=8080

echo Starting backend: profile=%PROFILE% port=%SERVER_PORT%
start "campus-backend" cmd /c "java -jar %JAR% --spring.profiles.active=%PROFILE% --server.port=%SERVER_PORT%"

echo.
echo Next: serve portal-web\dist and admin-web\dist via Nginx and
echo reverse proxy /api and /files to http://127.0.0.1:%SERVER_PORT%
popd
endlocal
