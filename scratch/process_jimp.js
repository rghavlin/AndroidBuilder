import { Jimp } from 'jimp';

async function processImage() {
  try {
    const image = await Jimp.read('client/public/images/entities/player.png');
    
    const bwImage = image.clone();

    for (let y = 0; y < image.bitmap.height; y++) {
      for (let x = 0; x < image.bitmap.width; x++) {
        const hex = image.getPixelColor(x, y);
        // hex is an unsigned 32-bit integer: 0xRRGGBBAA
        // extract alpha
        const a = hex & 0xFF;
        
        // We want figure to be black (0), bg to be white (255)
        const val = 255 - a;
        
        // combine into 0xRRGGBBAA
        // r, g, b = val; a = 255
        const newHex = (val << 24 | val << 16 | val << 8 | 255) >>> 0;
        bwImage.setPixelColor(newHex, x, y);
      }
    }
    
    // We will save bwImage
    bwImage.write('client/public/images/entities/player_bw.png');
    
    // Now let's create an embossed version
    const embossedImage = bwImage.clone();
    
    // Simple emboss matrix
    const embossMatrix = [
      [-2, -1, 0],
      [-1,  1, 1],
      [ 0,  1, 2]
    ];
    
    embossedImage.convolute(embossMatrix);
    embossedImage.write('client/public/images/entities/player_embossed.png');
    
    console.log('Images generated successfully!');
  } catch (err) {
    console.error('Error generating images:', err);
  }
}

processImage();
