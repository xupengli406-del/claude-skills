param(
    [Parameter(Mandatory = $true)]
    [string]$Source,

    [Parameter(Mandatory = $true)]
    [string]$Narration,

    [Parameter(Mandatory = $true)]
    [string]$Subtitles,

    [Parameter(Mandatory = $true)]
    [string]$SegmentsJson,

    [Parameter(Mandatory = $true)]
    [string]$Output,

    [int]$Width = 1920,
    [int]$Height = 1080,
    [int]$Fps = 30,
    [ValidateSet("fit", "fill", "stretch")]
    [string]$ScaleMode = "fit",
    [int]$Crf = 18,
    [string]$FontName = "Microsoft YaHei",
    [int]$FontSize = 18
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ffmpeg = Get-Command ffmpeg -ErrorAction Stop
$sourcePath = [System.IO.Path]::GetFullPath($Source)
$narrationPath = [System.IO.Path]::GetFullPath($Narration)
$subtitlePath = [System.IO.Path]::GetFullPath($Subtitles)
$segmentsPath = [System.IO.Path]::GetFullPath($SegmentsJson)
$outputPath = [System.IO.Path]::GetFullPath($Output)

foreach ($path in @($sourcePath, $narrationPath, $subtitlePath, $segmentsPath)) {
    if (-not [System.IO.File]::Exists($path)) {
        throw "找不到输入文件：$path"
    }
}

if ($outputPath -eq $sourcePath) {
    throw "输出文件不能覆盖原视频"
}

[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($outputPath)) | Out-Null

$segments = @(Get-Content -LiteralPath $segmentsPath -Raw -Encoding UTF8 | ConvertFrom-Json)
if ($segments.Count -lt 1) {
    throw "剪辑计划至少需要一个片段"
}

$filterLines = [System.Collections.Generic.List[string]]::new()
$labels = [System.Collections.Generic.List[string]]::new()

for ($i = 0; $i -lt $segments.Count; $i++) {
    $start = [double]$segments[$i].start
    $end = [double]$segments[$i].end
    $speed = [double]$segments[$i].speed

    if ($start -lt 0 -or $end -le $start -or $speed -le 0) {
        throw "第 $($i + 1) 个片段的 start、end 或 speed 无效"
    }

    $startText = $start.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)
    $endText = $end.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)
    $speedText = $speed.ToString("0.###", [System.Globalization.CultureInfo]::InvariantCulture)
    $label = "v$i"

    $filterLines.Add("[0:v]trim=start=$startText`:end=$endText,setpts=(PTS-STARTPTS)/$speedText[$label]")
    $labels.Add("[$label]")
}

switch ($ScaleMode) {
    "fit" {
        $scale = "scale=$Width`:$Height`:force_original_aspect_ratio=decrease`:flags=lanczos,pad=$Width`:$Height`:(ow-iw)/2`:(oh-ih)/2`:color=black"
    }
    "fill" {
        $scale = "scale=$Width`:$Height`:force_original_aspect_ratio=increase`:flags=lanczos,crop=$Width`:$Height"
    }
    default {
        $scale = "scale=$Width`:$Height`:flags=lanczos"
    }
}

$subtitleDirectory = [System.IO.Path]::GetDirectoryName($subtitlePath)
$subtitleName = [System.IO.Path]::GetFileName($subtitlePath).Replace("'", "\'")
$concat = ($labels -join "") + "concat=n=$($labels.Count):v=1:a=0"
$style = "FontName=$FontName,FontSize=$FontSize,PrimaryColour=&H00FFFFFF,OutlineColour=&H00111111,BackColour=&HA0000000,BorderStyle=3,Outline=1,Shadow=0,MarginV=24,Alignment=2,Spacing=0.2"
$filterLines.Add("$concat,fps=$Fps,$scale,unsharp=5:5:0.55:5:5:0.0,eq=contrast=1.03:saturation=1.04,subtitles='$subtitleName':force_style='$style',format=yuv420p[vout]")

$filterPath = Join-Path $subtitleDirectory (".faceless-video-filter-" + [guid]::NewGuid().ToString("N") + ".txt")
$filterText = $filterLines -join ";`n"
[System.IO.File]::WriteAllText($filterPath, $filterText, [System.Text.UTF8Encoding]::new($false))

Push-Location $subtitleDirectory
try {
    & $ffmpeg.Source -y `
        -i $sourcePath `
        -i $narrationPath `
        -filter_complex_script $filterPath `
        -map "[vout]" `
        -map "1:a:0" `
        -c:v libx264 `
        -preset medium `
        -crf $Crf `
        -profile:v high `
        -level 4.1 `
        -c:a aac `
        -b:a 192k `
        -ar 48000 `
        -af "loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:st=0:d=0.2" `
        -movflags +faststart `
        -shortest `
        $outputPath

    if ($LASTEXITCODE -ne 0 -or -not [System.IO.File]::Exists($outputPath)) {
        throw "视频渲染失败"
    }
}
finally {
    Pop-Location
    if ([System.IO.File]::Exists($filterPath)) {
        [System.IO.File]::Delete($filterPath)
    }
}

Write-Output $outputPath
