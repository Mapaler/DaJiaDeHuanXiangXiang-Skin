@echo off
::压缩质量
set /a quality=80
set dataDec=..\Resources
echo 设定转换质量为%quality%
::转换立绘
title 正在转换立绘
for /f %%f in ('dir /b %dataDec%\char\charimg\*.png') do (
if not exist %dataDec%\char\charimg\%%~nf.webp (
 tools\cwebp.exe %dataDec%\char\charimg\%%f -q %quality% -o %dataDec%\char\charimg\%%~nf.webp
) else (
 echo 立绘 %%~nf.webp 已存在，跳过
)
)
::转换Q版图像
title 正在转换Q版图像
for /f %%f in ('dir /b %dataDec%\char\charcute\*.png') do (
if not exist %dataDec%\char\charcute\%%~nf.webp (
 tools\cwebp.exe %dataDec%\char\charcute\%%f -q %quality% -o %dataDec%\char\charcute\%%~nf.webp
) else (
 echo Q版 %%~nf.webp 已存在，跳过
)
)
::转换道具图像
title 正在转换道具图像
for /f %%f in ('dir /b %dataDec%\equipment\*.png') do (
if not exist %dataDec%\equipment\%%~nf.webp (
 tools\cwebp.exe %dataDec%\equipment\%%f -q %quality% -o %dataDec%\equipment\%%~nf.webp
) else (
 echo 道具 %%~nf.webp 已存在，跳过
)
)
title 转换完毕
echo 转换完毕
pause