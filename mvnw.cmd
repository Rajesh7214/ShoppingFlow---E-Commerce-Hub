@REM ----------------------------------------------------------------------------
@REM Maven Wrapper Script for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

set MAVEN_CACHED=C:\Users\rajes\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd

where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 (
    mvn %*
    goto end
)

if exist "%MAVEN_CACHED%" (
    call "%MAVEN_CACHED%" %*
    goto end
)

echo [ERROR] Maven not found on PATH and cached wrapper not located.
exit /b 1

:end
endlocal
