# ============================================
# 手动调用 Edge Function 脚本（PowerShell 版本）
# 用途：当 pg_net 扩展未启用时，使用 Invoke-WebRequest 调用 Edge Function
# 
# 使用方法：
# .\scripts\call-edge-function-manually.ps1
# ============================================

# 配置
$SUPABASE_URL = if ($env:SUPABASE_URL) { $env:SUPABASE_URL } else { "https://vkafrwwskupsyibrvcvd.supabase.co" }
$SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $SERVICE_ROLE_KEY) {
    Write-Host "❌ 错误: SUPABASE_SERVICE_ROLE_KEY 未设置" -ForegroundColor Red
    Write-Host "   请设置: `$env:SUPABASE_SERVICE_ROLE_KEY='your-key'" -ForegroundColor Yellow
    exit 1
}

$EDGE_FUNCTION_URL = "$SUPABASE_URL/functions/v1/dead-man-check"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 调用 Edge Function: dead-man-check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URL: $EDGE_FUNCTION_URL" -ForegroundColor White
Write-Host ""

try {
    # 调用 Edge Function
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    }
    
    $body = @{} | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri $EDGE_FUNCTION_URL `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -UseBasicParsing
    
    Write-Host "HTTP 状态码: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "响应内容:" -ForegroundColor Cyan
    
    # 尝试格式化 JSON
    try {
        $jsonResponse = $response.Content | ConvertFrom-Json
        $jsonResponse | ConvertTo-Json -Depth 10 | Write-Host
    } catch {
        Write-Host $response.Content
    }
    
    Write-Host ""
    Write-Host "✅ Edge Function 调用成功" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 提示: 等待 5-10 秒后，在 Supabase SQL Editor 中执行验证查询" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Edge Function 调用失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "1. Edge Function 是否已部署" -ForegroundColor White
    Write-Host "2. SERVICE_ROLE_KEY 是否正确" -ForegroundColor White
    Write-Host "3. Edge Function 日志中的错误信息" -ForegroundColor White
}



