@echo off
if exist APK_Unpack (
title 存在旧的APK解包，正在删除
RMDIR /Q /S APK_Unpack
)
title 正在解压APK压缩包
tools\7z.exe e *.apk -oAPK_Unpack -spf -y
if exist Export_Data (
title 存在旧的导出资源，正在删除
RMDIR /Q /S Export_Data
)
MKDIR Export_Data
title 导出资源
echo 请在uTinyRipper中导出所有资源到Export_Data
echo %~dp0Export_Data
tools\uTinyRipper\uTinyRipper.exe APK_Unpack\assets\bin\Data