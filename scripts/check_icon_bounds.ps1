Add-Type -AssemblyName System.Drawing
$currentDir = Get-Location
$filePath = Join-Path $currentDir "himnario\assets\images\play-store-icon-512.png"
$bmp = [System.Drawing.Bitmap]::FromFile($filePath)
$minX = 512; $maxX = 0; $minY = 512; $maxY = 0;
$bg = $bmp.GetPixel(5, 5)

for ($y = 0; $y -lt 512; $y++) {
    for ($x = 0; $x -lt 512; $x++) {
        $p = $bmp.GetPixel($x, $y)
        $diff = [Math]::Abs($p.R - $bg.R) + [Math]::Abs($p.G - $bg.G) + [Math]::Abs($p.B - $bg.B)
        if ($diff -gt 30) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
$width = $maxX - $minX
$height = $maxY - $minY
Write-Output "Current Artwork Dimensions:"
Write-Output "Width: $width px (Left: $minX, Right: $maxX)"
Write-Output "Height: $height px (Top: $minY, Bottom: $maxY)"
$bmp.Dispose()
