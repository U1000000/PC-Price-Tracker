@echo off
mode con: cols=70 lines=25
cls

start /B node server.js > NUL 2>&1

set load=0
:loading
set /a load+=5
if %load%==100 goto loaded
cls
echo.
echo    =======================================
echo    =      PC PARCA TAKIP UYGULAMASI     =
echo    =======================================
echo.
echo Server baslatiliyor...
echo Parca fiyatlari aliniyor, yaklasik 20 saniye surecek.
echo.
<nul set /p =Yukleniyor: [
set /a blocks=%load%/2
for /L %%i in (1,1,%blocks%) do <nul set /p =#
for /L %%i in (%blocks%,1,50) do <nul set /p =-
<nul set /p =] %load%%%
echo.
timeout /t 1 /nobreak > nul
goto loading

:loaded
cls
echo.
echo    =======================================
echo    =      PC PARCA TAKIP UYGULAMASI     =
echo    =======================================
echo.
echo    Site http://localhost:3000 adresinde hazir.
echo    Komut istemini kapattiginizda site acilamaz hale gelecektir.
echo.
echo    [U] Siteye Git
echo    [E] Komut Istemini Kapat
echo.
choice /c "UE" /n /m ""

if errorlevel 2 (
    taskkill /F /IM node.exe > nul 2>&1
    exit
) else (
    start chrome http://localhost:3000
    goto menu
)

:menu
cls
echo.
echo    =======================================
echo    =      PC PARCA TAKIP UYGULAMASI     =
echo    =======================================
echo.
echo             Site Acildi!
echo.
echo    [U] Siteyi Tekrar Ac
echo    [E] Komut Istemini Kapat
echo.
choice /c "UE" /n /m ""
if errorlevel 2 (
    taskkill /F /IM node.exe > nul 2>&1
    exit
) else (
    start chrome http://localhost:3000
    goto menu
)