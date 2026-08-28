@echo off
title Shallot Money - Transaction Reconciler
cls
echo ========================================================
echo        Shallot Money - PC Companion Reconciler
echo ========================================================
echo.
python "%~dp0reconcile.py"
echo.
echo Press any key to open the outputs folder...
pause >nul
start "" "%~dp0outputs"
