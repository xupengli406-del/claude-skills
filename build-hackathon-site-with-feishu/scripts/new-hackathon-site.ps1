param(
  [Parameter(Mandatory=$true)][string]$Name,
  [Parameter(Mandatory=$true)][string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$base = (Resolve-Path $OutputDirectory).Path
$target = Join-Path $base $Name
if (Test-Path $target) { throw "Target directory already exists: $target" }

New-Item -ItemType Directory -Path $target | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target 'data') | Out-Null
New-Item -ItemType Directory -Path (Join-Path $target 'site') | Out-Null

$skillRoot = Split-Path -Parent $PSScriptRoot
Copy-Item (Join-Path $skillRoot 'assets\hackathon.config.example.json') (Join-Path $target 'hackathon.config.json')
Copy-Item (Join-Path $skillRoot 'assets\registration-schema.csv') (Join-Path $target 'data\registration-schema.csv')
Copy-Item -Path (Join-Path $skillRoot 'assets\site-template\*') -Destination (Join-Path $target 'site') -Recurse -Force

Write-Output "Hackathon website project created: $target"
Write-Output 'Next: build the bundled classic spotlight baseline first; then replace placeholders, connect Feishu, test, and deploy.'
