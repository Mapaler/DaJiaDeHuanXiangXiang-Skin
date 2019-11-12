@echo off
if exist APK_Unpack (
title 存在旧的APK解包，正在删除
DEL /Q /F /S APK_Unpack
)
title 正在解压APK压缩包
7z.exe e *.apk -oAPK_Unpack -spf
if exist Export_Data (
title 存在旧的导出资源，正在删除
DEL /Q /F /S Export_Data
)
MKDIR Export_Data
title 导出资源
echo 请在uTinyRipper中导出所有资源到Export_Data
echo %~dp0Export_Data
uTinyRipper_x64\uTinyRipper.exe APK_Unpack\assets\bin\Data