<#
Creates a zip of build artifacts (dist folders) into out/ with a timestamped filename.
#>

$outDir = Join-Path -Path $PSScriptRoot -ChildPath "..\out"
$distDirs = @("..\dist", "..\renderer\dist")

if (-not (Test-Path -Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$zipPath = Join-Path $outDir "build-$(Get-Date -Format yyyyMMddHHmmss).zip"

Write-Output ("Creating zip: {0}" -f $zipPath)

$filesToInclude = @()
foreach ($d in $distDirs) {
  $full = Join-Path $PSScriptRoot $d
  if (Test-Path $full) { $filesToInclude += $full }
}

if ($filesToInclude.Count -eq 0) {
  Write-Output "No dist directories found to package. Run build first."
  exit 1
}

Compress-Archive -Path $filesToInclude -DestinationPath $zipPath -Force
Write-Output ("Packaged artifacts to {0}" -f $zipPath)
