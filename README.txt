安装指定依赖模块
npm i
进入开发
run_dev.bat 
构建release版本
run_build.bat

xcopy /y /c /h /r "main.js" "XXX\.obsidian\plugins\spark-for-obsidian"
xcopy /y /c /h /r "manifest.json" "XXX\.obsidian\plugins\spark-for-obsidian"
pause