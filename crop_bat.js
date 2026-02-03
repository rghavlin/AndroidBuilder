const Jimp = require('jimp');

async function cropImage() {
    const inputPath = 'C:/Users/r/.gemini/antigravity/brain/82ad11ec-09e4-4875-aa33-6294a37f0c18/baseball_bat_pictogram_v2_1770103660917.png';
    const outputPath = 'C:/Users/r/.gemini/antigravity/brain/82ad11ec-09e4-4875-aa33-6294a37f0c18/baseball_bat_icon_4x1.png';

    const image = await Jimp.read(inputPath);
    // crop(x, y, w, h)
    image.crop(0, 384, 1024, 256);
    await image.writeAsync(outputPath);
    console.log('Image cropped successfully!');
}

cropImage().catch(console.error);
