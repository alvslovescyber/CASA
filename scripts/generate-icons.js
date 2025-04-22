const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const sizes = {
    mac: [16, 32, 64, 128, 256, 512, 1024],
    png: [16, 32, 48, 64, 128, 256, 512, 1024],
    win: [16, 32, 48, 256]
};

async function generateIcons() {
    const sourceFile = path.join(__dirname, '../build/icons/icon.svg');
    
    // Ensure directories exist
    await Promise.all([
        fs.mkdir(path.join(__dirname, '../build/icons/mac'), { recursive: true }),
        fs.mkdir(path.join(__dirname, '../build/icons/png'), { recursive: true }),
        fs.mkdir(path.join(__dirname, '../build/icons/win'), { recursive: true })
    ]);

    // Generate PNG icons
    for (const size of sizes.png) {
        await sharp(sourceFile)
            .resize(size, size)
            .png()
            .toFile(path.join(__dirname, `../build/icons/png/icon-${size}.png`));
    }

    // Generate Windows ICO
    const icoSizes = sizes.win.map(size => ({
        input: path.join(__dirname, `../build/icons/png/icon-${size}.png`),
        size: size
    }));

    await sharp(sourceFile)
        .resize(256, 256)
        .toFile(path.join(__dirname, '../build/icons/win/icon.ico'));

    // Generate macOS ICNS
    // Note: For proper ICNS generation, you might want to use a dedicated ICNS generator
    // This is a simplified version that copies the largest PNG
    await sharp(sourceFile)
        .resize(1024, 1024)
        .png()
        .toFile(path.join(__dirname, '../build/icons/mac/icon.icns'));

    console.log('Icon generation complete!');
}

generateIcons().catch(console.error); 