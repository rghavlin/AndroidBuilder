Add-Type -AssemblyName System.Drawing
$src = 'C:\Users\r\.gemini\antigravity\brain\eac0019c-ec12-4740-bcf3-09de0f0a0cae\rifle_scope_pictogram_v2_centered_1767163149345.png'
$dst = 'c:\Games\AndroidBuilder\client\public\images\items\rifle_scope.png'
$img = [System.Drawing.Image]::FromFile($src)
$bmp = New-Object System.Drawing.Bitmap(1024, 512)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$srcRect = New-Object System.Drawing.Rectangle(0, 256, 1024, 512)
$dstRect = New-Object System.Drawing.Rectangle(0, 0, 1024, 512)
$g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
