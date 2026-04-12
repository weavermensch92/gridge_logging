Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
strPS = strDir & "\gridge-tray.ps1"
WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & strPS & """", 0, False
