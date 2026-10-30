Add-Type -AssemblyName System.Drawing
$currentDir = Get-Location
$srcPath = Join-Path $currentDir "himnario\assets\images\android-legacy-app-logo.png"
$destPath = Join-Path $currentDir "himnario\assets\images\play-store-icon-512.png"

$src = [System.Drawing.Image]::FromFile($srcPath)
$dest = New-Object System.Drawing.Bitmap 512, 512
$g = [System.Drawing.Graphics]::FromImage($dest)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 512, 512)
$dest.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$dest.Dispose()
$src.Dispose()
Write-Output "Successfully generated play-store-icon-512.png"
