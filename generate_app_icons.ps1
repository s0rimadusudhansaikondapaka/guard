Add-Type -AssemblyName System.Drawing

$srcPath = "c:\RD\VM - Copy\frontend\VMS\public\official_sms_owof_logo.png"
if (-not (Test-Path $srcPath)) {
    $srcPath = "c:\RD\VM - Copy\frontend\VMS\public\one_world_one_family_logo.jpg"
}

Write-Host "Using source logo: $srcPath"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)

$resDir = "c:\RD\VM - Copy\mobile\myAsram\android\app\src\main\res"

$sizes = @(
    @{ Folder="mipmap-mdpi"; Main=48; Fore=108 },
    @{ Folder="mipmap-hdpi"; Main=72; Fore=162 },
    @{ Folder="mipmap-xhdpi"; Main=96; Fore=216 },
    @{ Folder="mipmap-xxhdpi"; Main=144; Fore=324 },
    @{ Folder="mipmap-xxxhdpi"; Main=192; Fore=432 }
)

function Resize-Image {
    param(
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutputPath,
        [bool]$IsForeground = $false
    )

    $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($IsForeground) {
        $g.Clear([System.Drawing.Color]::Transparent)
        $innerW = [int]($Width * 0.70)
        $innerH = [int]($Height * 0.70)
        $offsetX = [int](($Width - $innerW) / 2)
        $offsetY = [int](($Height - $innerH) / 2)
        $g.DrawImage($Image, $offsetX, $offsetY, $innerW, $innerH)
    } else {
        $g.Clear([System.Drawing.Color]::FromArgb(255, 128, 0, 0)) # Maroon background #800000
        $g.DrawImage($Image, 0, 0, $Width, $Height)
    }

    $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

foreach ($item in $sizes) {
    $dirPath = Join-Path $resDir $item.Folder
    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
    }

    $mainPath = Join-Path $dirPath "ic_launcher.png"
    $roundPath = Join-Path $dirPath "ic_launcher_round.png"
    $forePath = Join-Path $dirPath "ic_launcher_foreground.png"

    Resize-Image -Image $srcImg -Width $item.Main -Height $item.Main -OutputPath $mainPath -IsForeground $false
    Resize-Image -Image $srcImg -Width $item.Main -Height $item.Main -OutputPath $roundPath -IsForeground $false
    Resize-Image -Image $srcImg -Width $item.Fore -Height $item.Fore -OutputPath $forePath -IsForeground $true

    Write-Host "Generated icons for $($item.Folder)"
}

$srcImg.Dispose()
Write-Host "App icon generation completed successfully!"
