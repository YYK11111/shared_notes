@echo off
setlocal enabledelayedexpansion

REM 设置控制台输出颜色
color 0A

REM 清除屏幕
cls

REM 标题
echo. & echo. & echo ============================================================
echo                    API连接测试工具
echo ============================================================
echo.

REM 检查curl命令是否可用
curl --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到curl命令。请确保curl已安装并添加到系统路径中。
    echo. & echo 按任意键退出...
    pause >nul
    exit /b 1
)

REM 后端基础URL
set "BASE_URL=http://localhost:3000/api"

REM 测试健康检查接口
echo [1/5] 测试健康检查接口...
echo 正在请求: %BASE_URL%/health
echo 命令: curl -s -o NUL -w "%%{http_code}" %BASE_URL%/health
for /f "tokens=*" %%a in ('curl -s -o NUL -w "%%{http_code}" %BASE_URL%/health') do set "status=%%a"

if "!status!" equ "200" (
    color 0A
    echo [成功] 后端服务正在运行 (状态码: !status!)
    curl -s %BASE_URL%/health
) else (
    color 0C
    echo [失败] 无法连接到后端服务 (状态码: !status!)
    echo 请确认后端服务是否已启动，端口是否为3000。
    goto :end
)
echo.

REM 测试用户相关接口
echo [2/5] 测试用户笔记接口...
curl -s -H "Authorization: Bearer test-token" %BASE_URL%/user/notes > notes_response.json
if %errorlevel% equ 0 (
    type notes_response.json
    del notes_response.json
) else (
    echo [错误] 请求失败
)
echo.

REM 测试用户分类接口
echo [3/5] 测试用户分类接口...
curl -s -H "Authorization: Bearer test-token" %BASE_URL%/user/categories > categories_response.json
if %errorlevel% equ 0 (
    type categories_response.json
    del categories_response.json
) else (
    echo [错误] 请求失败
)
echo.

REM 测试推荐笔记接口
echo [4/5] 测试推荐笔记接口...
curl -s -H "Authorization: Bearer test-token" %BASE_URL%/user/recommend-notes > recommend_response.json
if %errorlevel% equ 0 (
    type recommend_response.json
    del recommend_response.json
) else (
    echo [错误] 请求失败
)
echo.

REM 测试热门笔记接口
echo [5/5] 测试热门笔记接口...
curl -s -H "Authorization: Bearer test-token" %BASE_URL%/user/hot-notes > hotnotes_response.json
if %errorlevel% equ 0 (
    type hotnotes_response.json
    del hotnotes_response.json
) else (
    echo [错误] 请求失败
)
echo.

REM 检查前端代理配置
echo ============================================================
echo                    前端代理配置检查
echo ============================================================

echo 检查前端.env文件配置...
findstr /C:"VITE_API_BASE_URL" frontend\.env

echo 检查前端vite.config.js代理配置...
findstr /C:"proxy" frontend\vite.config.js

echo.
echo 测试完成！
echo 建议:
if exist "frontend\.env" (
echo 1. 确保VITE_API_BASE_URL配置正确，不包含多余的/api后缀
) else (
echo 1. 前端.env文件不存在，请创建
)
echo 2. 检查vite.config.js中的代理配置是否指向正确的后端地址

echo.
:end
echo 按任意键退出...
pause >nul
color 07
endlocal