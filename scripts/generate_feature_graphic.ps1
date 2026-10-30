Add-Type -AssemblyName System.Drawing
$currentDir = Get-Location
$iconPath = Join-Path $currentDir "himnario\assets\images\play-store-icon-512.png"
$destPath = Join-Path $currentDir "himnario\assets\images\play-store-feature-graphic-1024x500.png"

$bmp = New-Object System.Drawing.Bitmap 1024, 500
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

# Background dark church theme (matching deep navy #0e1626 / #162238)
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 14, 22, 38))
$g.FillRectangle($brush, 0, 0, 1024, 500)
$brush.Dispose()

# Subtle accent gradient line at top
$accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 212, 175, 55)) # Gold #d4af37
$g.FillRectangle($accentBrush, 0, 0, 1024, 4)
$accentBrush.Dispose()

# Draw App Icon on the left
$icon = [System.Drawing.Image]::FromFile($iconPath)
$iconSize = 280
$iconX = 90
$iconY = [int]((500 - $iconSize) / 2)
$g.DrawImage($icon, $iconX, $iconY, $iconSize, $iconSize)
$icon.Dispose()

# Typography on the right
$fontTitle = New-Object System.Drawing.Font("Georgia", 34, [System.Drawing.FontStyle]::Bold)
$fontSubtitle = New-Object System.Drawing.Font("Segoe UI", 16, [System.Drawing.FontStyle]::Regular)
$fontMotto = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Italic)

$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 245, 245))
$goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 224, 185, 90))
$mutedBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 160, 174, 192))

$textX = 410
$g.DrawString("Himnario", $fontTitle, $whiteBrush, $textX, 140)
$g.DrawString("El Buen Pastor", $fontTitle, $goldBrush, $textX, 195)
$g.DrawString("637 Himnos  •  124 Coros  •  Audio y Letra", $fontSubtitle, $whiteBrush, $textX, 265)
$g.DrawString("Verdad, honestidad, justicia, santidad y caridad", $fontMotto, $mutedBrush, $textX, 310)

# Cleanup
$fontTitle.Dispose()
$fontSubtitle.Dispose()
$fontMotto.Dispose()
$whiteBrush.Dispose()
$goldBrush.Dispose()
$mutedBrush.Dispose()
$g.Dispose()

$bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "Successfully generated play-store-feature-graphic-1024x500.png"
