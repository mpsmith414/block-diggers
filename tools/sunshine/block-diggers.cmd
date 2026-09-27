@echo off
rem Block Diggers launcher for a Sunshine application tile.
rem Starts Chrome full-screen on the game and waits for it, so Sunshine can
rem close it when the Moonlight stream ends. Optional arg: a URL to open instead.
setlocal
set "URL=%~1"
if "%URL%"=="" set "URL=https://mpsmith414.github.io/block-diggers/"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Block Diggers: Chrome not found. Install Google Chrome.
  exit /b 1
)

rem Its own profile = its own Chrome process (otherwise the URL is handed to an
rem already-open Chrome and this script exits at once). Saves live here too.
"%CHROME%" --kiosk --user-data-dir="%LOCALAPPDATA%\BlockDiggers\chrome-profile" ^
  --autoplay-policy=no-user-gesture-required --no-first-run ^
  --no-default-browser-check --hide-crash-restore-bubble "%URL%"
