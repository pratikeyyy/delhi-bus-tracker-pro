@echo off
echo 🚌 Bus Tracker Demo Server
echo 📂 Serving files from current directory
echo 🌐 Starting server on http://localhost:8080
echo 📱 Open http://localhost:8080/demo.html to view your Bus Tracker!
echo ⚡ Press Ctrl+C to stop the server
echo.

REM Try to start with Python first
python -m http.server 8080 2>nul
if %errorlevel% neq 0 (
    REM If Python fails, try with PowerShell
    powershell -Command "& {Add-Type -AssemblyName System.Web; $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8080/'); $listener.Start(); Write-Host 'Server running on http://localhost:8080/demo.html'; Start-Process 'http://localhost:8080/demo.html'; while($listener.IsListening) { $context = $listener.GetContext(); $response = $context.Response; $file = $context.Request.Url.LocalPath.TrimStart('/'); if($file -eq '') {$file = 'demo.html'}; if(Test-Path $file) { $content = Get-Content $file -Raw; $buffer = [Text.Encoding]::UTF8.GetBytes($content); $response.ContentLength64 = $buffer.Length; $response.OutputStream.Write($buffer, 0, $buffer.Length); } else { $response.StatusCode = 404; }; $response.Close(); }}"
)

pause
