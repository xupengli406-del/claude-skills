param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$OutputDirectory
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ffmpeg = Get-Command ffmpeg -ErrorAction Stop
$ffprobe = Get-Command ffprobe -ErrorAction Stop
$sourcePath = [System.IO.Path]::GetFullPath($Source)
$outputPath = [System.IO.Path]::GetFullPath($OutputDirectory)

if (-not [System.IO.File]::Exists($sourcePath)) {
    throw "找不到源视频：$sourcePath"
}

[System.IO.Directory]::CreateDirectory($outputPath) | Out-Null

$metadataPath = Join-Path $outputPath "视频参数.json"
$contactSheetPath = Join-Path $outputPath "画面检查联系表.png"

$metadata = & $ffprobe.Source -v error `
    -show_entries "format=duration,size,bit_rate:stream=index,codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels" `
    -of json $sourcePath

[System.IO.File]::WriteAllText(
    $metadataPath,
    ($metadata -join [Environment]::NewLine),
    [System.Text.UTF8Encoding]::new($false)
)

$durationText = & $ffprobe.Source -v error -show_entries "format=duration" -of "default=noprint_wrappers=1:nokey=1" $sourcePath
$duration = [double]::Parse($durationText, [System.Globalization.CultureInfo]::InvariantCulture)
$interval = [math]::Max(1.0, $duration / 12.0)
$intervalText = $interval.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)

& $ffmpeg.Source -y -i $sourcePath `
    -vf "fps=1/$intervalText,scale=480:-1,tile=4x3:padding=8:margin=8" `
    -frames:v 1 -update 1 $contactSheetPath

if ($LASTEXITCODE -ne 0 -or -not [System.IO.File]::Exists($contactSheetPath)) {
    throw "联系表生成失败"
}

Write-Output $metadataPath
Write-Output $contactSheetPath

