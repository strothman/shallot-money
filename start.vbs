Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = currentDir

' Launch Vite dev server completely hidden (0 = hidden window)
WshShell.Run "cmd.exe /c npm run dev", 0, False

' Give Vite 2 seconds to initialize, then launch the browser
WScript.Sleep 2000
WshShell.Run "cmd.exe /c start http://localhost:5173", 0, False
