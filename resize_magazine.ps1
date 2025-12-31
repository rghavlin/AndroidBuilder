Add-Type -AssemblyName System.Drawing
$src = 'C:\Users\r\.gemini\antigravity\brain\a9c86fff-c2c5-44f3-80f7-3c7e476c3a48\uploaded_image_1767167420366.png'
$dst = 'c:\Games\AndroidBuilder\client\public\images\items\9mm_magazine.png'
$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$dstRect = New-Object System.Drawing.Rectangle(0, 0, 1024, 1024)
$g.DrawImage($img, $dstRect)
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
