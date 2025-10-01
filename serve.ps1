# Simple HTTP Server for Bus Tracker Demo
$port = 8080
$path = Get-Location

Write-Host "🚌 Bus Tracker Demo Server" -ForegroundColor Green
Write-Host "📂 Serving files from: $path" -ForegroundColor Cyan
Write-Host "🌐 Starting server on http://localhost:$port" -ForegroundColor Yellow
Write-Host "📱 Open http://localhost:$port/demo.html to view your Bus Tracker!" -ForegroundColor Magenta
Write-Host "🔗 API Documentation: http://localhost:$port/README.md" -ForegroundColor Blue
Write-Host "⚡ Press Ctrl+C to stop the server" -ForegroundColor Red

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "✅ Server running successfully!" -ForegroundColor Green

# Try to open browser
Start-Process "http://localhost:$port/demo.html"
Write-Host "🎯 Browser opened automatically!" -ForegroundColor Green

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $requestedFile = $request.Url.LocalPath.TrimStart('/')
    if ($requestedFile -eq "") { $requestedFile = "demo.html" }
    
    $filePath = Join-Path $path $requestedFile
    
    Write-Host "📥 Request: $($request.HttpMethod) $($request.Url.LocalPath)" -ForegroundColor Cyan
    
    if (Test-Path $filePath -PathType Leaf) {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
        
        # Set content type
        $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
        switch ($extension) {
            ".html" { $response.ContentType = "text/html; charset=utf-8" }
            ".css"  { $response.ContentType = "text/css" }
            ".js"   { $response.ContentType = "application/javascript" }
            ".json" { $response.ContentType = "application/json" }
            ".md"   { $response.ContentType = "text/markdown" }
            default { $response.ContentType = "text/plain" }
        }
        
        $response.ContentLength64 = $buffer.Length
        $response.StatusCode = 200
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    } else {
        $response.StatusCode = 404
        $errorMessage = "File not found: $requestedFile"
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorMessage)
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        Write-Host "❌ 404: $requestedFile" -ForegroundColor Red
    }
    
    $response.Close()
}
