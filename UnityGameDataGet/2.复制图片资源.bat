@echo off
setlocal enabledelayedexpansion
set dataSrc=Export_Data\globalgamemanagers\Assets\Resources
set dataDec=..\Resources
if not exist %dataDec%\char (MKDIR %dataDec%\char)
::复制立绘
title 复制立绘
echo 正在将立绘文件名转换为大写并复制到网页资源
if not exist %dataDec%\char\charimg (MKDIR %dataDec%\char\charimg)
for /f %%f in ('dir /b %dataSrc%\char\charimg\*.png') do (
::只保留文件名部分
set str=%%~nf
::循环替换为大写，输出到!str!
for %%i in (A B C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (call set str=%%str:%%i=%%i%%)
set newpath=%dataDec%\char\charimg\!str!.png
if not exist !newpath! (copy %dataSrc%\char\charimg\%%f !newpath!) else (echo !str!.png 已存在)
)
::复制Q版
title 复制Q版
echo 正在将Q版文件名转换为大写并复制到网页资源
if not exist %dataDec%\char\charcute (MKDIR %dataDec%\char\charcute)
for /f %%f in ('dir /b %dataSrc%\char\charcute\*.png') do (
::只保留文件名部分
set str=%%~nf
::循环替换为大写，输出到!str!
for %%i in (A B C D E F G H I J K L M N O P Q R S T U V W X Y Z) do (call set str=%%str:%%i=%%i%%)
set newpath=%dataDec%\char\charcute\!str!.png
if not exist !newpath! (copy %dataSrc%\char\charcute\%%f !newpath!) else (echo !str!.png 已存在)
)