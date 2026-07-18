Start-Process -FilePath "node" -ArgumentList "node_modules\tsx\dist\cli.mjs","src\index.ts" -WorkingDirectory "D:\AI\vietnamese-demo" -WindowStyle Minimized
Start-Sleep -Seconds 4
try { $r = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 3; Write-Host "SERVER OK: $($r.Content)" } catch { Write-Host "SERVER FAIL: $($_.Exception.Message)" }
