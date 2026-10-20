[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,

    [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'

$LabelLodging = [regex]::Unescape('\u4F4F\u5BBF')
$LabelLocalTransit = [regex]::Unescape('\u5E02\u5185\u4EA4\u901A')
$LabelFlight = [regex]::Unescape('\u4EA4\u901A\u5DE5\u5177-\u98DE\u673A')
$LabelTrain = [regex]::Unescape('\u4EA4\u901A\u5DE5\u5177-\u706B\u8F66')
$LabelNeedsReview = [regex]::Unescape('\u5F85\u786E\u8BA4')
$UploadFolderName = [regex]::Unescape('_\u6C47\u8054\u6613\u4E0A\u4F20\u6682\u5B58')
$InvoiceCountSuffix = [regex]::Unescape('\u5F20\u53D1\u7968')
$ManifestSuffix = [regex]::Unescape('\u53D1\u7968\u6E05\u5355')

function Get-UniquePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $Path
    }

    $directory = [System.IO.Path]::GetDirectoryName($Path)
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($Path)
    $extension = [System.IO.Path]::GetExtension($Path)
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    return [System.IO.Path]::Combine($directory, "$stem-$stamp$extension")
}

function Get-DateFromName {
    param([string]$Name)

    $match = [regex]::Match(
        $Name,
        '(?<year>20\d{2})[-._\u5E74](?<month>\d{1,2})[-._\u6708](?<day>\d{1,2})'
    )
    if (-not $match.Success) {
        return $null
    }

    return '{0:D4}-{1:D2}-{2:D2}' -f `
        [int]$match.Groups['year'].Value, `
        [int]$match.Groups['month'].Value, `
        [int]$match.Groups['day'].Value
}

function Get-AmountFromName {
    param([string]$Name)

    $matches = [regex]::Matches(
        $Name,
        '(?<!\d)(?<amount>\d+(?:\.\d{1,2})?)\u5143'
    )
    if ($matches.Count -eq 0) {
        return $null
    }

    return [decimal](
        $matches[$matches.Count - 1].Groups['amount'].Value
    )
}

function Get-ExpenseCategory {
    param([System.IO.FileInfo]$File)

    $path = $File.FullName
    if ($path -match '\u4F4F\u5BBF|\u9152\u5E97') {
        return $LabelLodging
    }
    if ($path -match '\u6253\u8F66|\u5E02\u5185\u4EA4\u901A|\u51FA\u79DF\u8F66|\u7F51\u7EA6\u8F66') {
        return $LabelLocalTransit
    }
    if ($path -match '\u98DE\u673A|\u673A\u7968|\u822A\u7A7A') {
        return $LabelFlight
    }
    if ($path -match '\u706B\u8F66|\u9AD8\u94C1|\u52A8\u8F66|\u94C1\u8DEF') {
        return $LabelTrain
    }
    return $LabelNeedsReview
}

function Find-RelatedItinerary {
    param(
        [System.IO.FileInfo]$Invoice,
        [AllowNull()]
        [object]$Amount
    )

    $candidates = Get-ChildItem -LiteralPath $Invoice.DirectoryName -File |
        Where-Object {
            $_.BaseName -match '\u884C\u7A0B\u5355|\u884C\u7A0B\u4FE1\u606F'
        }

    if ($null -ne $Amount) {
        $amountText = ([decimal]$Amount).ToString('0.00')
        $matched = $candidates |
            Where-Object { $_.BaseName -like "*$amountText*" } |
            Select-Object -First 1
        if ($null -ne $matched) {
            return $matched.Name
        }
    }

    $fallback = $candidates | Select-Object -First 1
    if ($null -ne $fallback) {
        return $fallback.Name
    }
    return $null
}

$resolvedSource = (Resolve-Path -LiteralPath $SourcePath).Path
if (-not (Test-Path -LiteralPath $resolvedSource -PathType Container)) {
    throw "SourcePath is not a directory: $resolvedSource"
}

if ([string]::IsNullOrWhiteSpace($OutputDirectory)) {
    $parent = [System.IO.Directory]::GetParent($resolvedSource).FullName
    $OutputDirectory = Join-Path $parent $UploadFolderName
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null

$supportedExtensions = @('.pdf', '.ofd', '.xml')
$excludedNamePattern = '\u884C\u7A0B\u5355|\u884C\u7A0B\u4FE1\u606F|\u8BA2\u5355\u622A\u56FE|\u8BA2\u5355\u660E\u7EC6|\u8BF4\u660E'

$invoiceFiles = Get-ChildItem -LiteralPath $resolvedSource -Recurse -File |
    Where-Object {
        $supportedExtensions -contains $_.Extension.ToLowerInvariant() -and
        $_.BaseName -notmatch $excludedNamePattern
    } |
    Sort-Object FullName

if ($invoiceFiles.Count -eq 0) {
    throw "No invoice candidates found under: $resolvedSource"
}

$manifest = @()
$index = 0
foreach ($file in $invoiceFiles) {
    $index += 1
    $amount = Get-AmountFromName -Name $file.BaseName
    $manifest += [pscustomobject][ordered]@{
        Index = $index
        ExpenseDate = Get-DateFromName -Name $file.BaseName
        SuggestedCategory = Get-ExpenseCategory -File $file
        AmountCNY = if ($null -eq $amount) { $null } else { $amount.ToString('0.00') }
        InvoiceFile = $file.Name
        RelativeFolder = $file.DirectoryName.Substring($resolvedSource.Length).TrimStart('\')
        RelatedItinerary = Find-RelatedItinerary -Invoice $file -Amount $amount
    }
}

$knownAmounts = @(
    $manifest |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_.AmountCNY) } |
        ForEach-Object { [decimal]$_.AmountCNY }
)
$total = [decimal]0
foreach ($amount in $knownAmounts) {
    $total += $amount
}

$leaf = [System.IO.Path]::GetFileName($resolvedSource.TrimEnd('\'))
$safeLeaf = $leaf -replace '[<>:"/\\|?*]', '_'
$zipPath = Get-UniquePath -Path (
    Join-Path $resolvedOutput "$safeLeaf`_$($invoiceFiles.Count)$InvoiceCountSuffix.zip"
)
$manifestPath = Get-UniquePath -Path (
    Join-Path $resolvedOutput "$safeLeaf`_$ManifestSuffix.csv"
)

$manifest | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipStream = [System.IO.File]::Open(
    $zipPath,
    [System.IO.FileMode]::CreateNew,
    [System.IO.FileAccess]::ReadWrite,
    [System.IO.FileShare]::None
)

try {
    $archive = New-Object System.IO.Compression.ZipArchive(
        $zipStream,
        [System.IO.Compression.ZipArchiveMode]::Create,
        $false
    )
    try {
        $zipIndex = 0
        foreach ($file in $invoiceFiles) {
            $zipIndex += 1
            $entryName = '{0:D2}_{1}' -f $zipIndex, $file.Name
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
                $archive,
                $file.FullName,
                $entryName,
                [System.IO.Compression.CompressionLevel]::Optimal
            ) | Out-Null
        }
    }
    finally {
        $archive.Dispose()
    }
}
finally {
    $zipStream.Dispose()
}

[pscustomobject][ordered]@{
    SourcePath = $resolvedSource
    InvoiceCount = $invoiceFiles.Count
    KnownAmountTotalCNY = $total.ToString('0.00')
    MissingAmountCount = @($manifest | Where-Object {
        [string]::IsNullOrWhiteSpace($_.AmountCNY)
    }).Count
    ZipPath = $zipPath
    ManifestPath = $manifestPath
}
