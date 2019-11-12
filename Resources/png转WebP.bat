@echo off
set quality=80
echo 设定转换质量为%quality%
::每次都重新转换head图片
title 正在转换Q版图像
echo 正在转换Q版图像
for /f %%f in ('dir /b *.png') do (
 .\cwebp.exe "%%f" -q %quality% -o "%%~nf.webp"
)
::立绘不重新转换
title 正在转换立绘
echo 正在转换立绘
for /f %%f in ('dir /b char\*.png') do (
if not exist "char\%%~nf.webp" (
 .\cwebp.exe "char\%%f" -q %quality% -o "char\%%~nf.webp"
) else (
 echo char\%%~nf.webp 已存在，跳过
)
)
title 转换完毕
echo 转换完毕
pause