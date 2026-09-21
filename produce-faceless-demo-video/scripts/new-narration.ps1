param(
    [Parameter(Mandatory = $true)]
    [string]$TextFile,

    [Parameter(Mandatory = $true)]
    [string]$OutputAudio,

    [Parameter(Mandatory = $true)]
    [string]$OutputSubtitles,

    [string]$Voice = "zh-CN-YunxiNeural",
    [string]$Rate = "+12%"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$edgeTts = Get-Command edge-tts -ErrorAction SilentlyContinue
$python = Get-Command python -ErrorAction SilentlyContinue
if ($null -eq $edgeTts -and $null -eq $python) {
    throw "未找到 edge-tts 命令或可用的 Python"
}
$textPath = [System.IO.Path]::GetFullPath($TextFile)
$audioPath = [System.IO.Path]::GetFullPath($OutputAudio)
$subtitlePath = [System.IO.Path]::GetFullPath($OutputSubtitles)

if (-not [System.IO.File]::Exists($textPath)) {
    throw "找不到口播稿：$textPath"
}

[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($audioPath)) | Out-Null
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($subtitlePath)) | Out-Null

if ($null -ne $edgeTts) {
    & $edgeTts.Source --voice $Voice --rate $Rate --file $textPath --write-media $audioPath --write-subtitles $subtitlePath
}
else {
    & $python.Source -m edge_tts --voice $Voice --rate $Rate --file $textPath --write-media $audioPath --write-subtitles $subtitlePath
}

if ($LASTEXITCODE -ne 0) {
    throw "配音生成失败"
}
if (-not [System.IO.File]::Exists($audioPath) -or -not [System.IO.File]::Exists($subtitlePath)) {
    throw "配音或字幕文件没有生成"
}

Write-Output $audioPath
Write-Output $subtitlePath
