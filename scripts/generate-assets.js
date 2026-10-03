const Jimp = require('jimp-compact');
const path = require('path');
const fs = require('fs');

const RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const ICON_SRC = path.join(ASSETS_DIR, 'icon.png');
const FOREGROUND_SRC = path.join(ASSETS_DIR, 'android-icon-foreground.png');
const SPLASH_SRC = path.join(ASSETS_DIR, 'splash-icon.png');

const DENSITIES = {
  mdpi: { icon: 48, foreground: 108, splash: 200 },
  hdpi: { icon: 72, foreground: 162, splash: 300 },
  xhdpi: { icon: 96, foreground: 216, splash: 400 },
  xxhdpi: { icon: 144, foreground: 324, splash: 600 },
  xxxhdpi: { icon: 192, foreground: 432, splash: 800 },
};

async function generate() {
  console.log('Loading source images...');
  const iconImg = await Jimp.read(ICON_SRC);
  const fgImg = await Jimp.read(FOREGROUND_SRC);
  const splashImg = await Jimp.read(SPLASH_SRC);

  for (const [density, sizes] of Object.entries(DENSITIES)) {
    const mipmapDir = path.join(RES_DIR, `mipmap-${density}`);
    const drawableDir = path.join(RES_DIR, `drawable-${density}`);

    if (!fs.existsSync(mipmapDir)) fs.mkdirSync(mipmapDir, { recursive: true });
    if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });

    // 1. ic_launcher & ic_launcher_round (PNG + WebP)
    const iconResized = iconImg.clone().resize(sizes.icon, sizes.icon, Jimp.RESIZE_BICUBIC);
    await iconResized.writeAsync(path.join(mipmapDir, 'ic_launcher.png'));
    await iconResized.writeAsync(path.join(mipmapDir, 'ic_launcher_round.png'));

    // 2. ic_launcher_foreground (PNG)
    const fgResized = fgImg.clone().resize(sizes.foreground, sizes.foreground, Jimp.RESIZE_BICUBIC);
    await fgResized.writeAsync(path.join(mipmapDir, 'ic_launcher_foreground.png'));

    // Remove old .webp files to avoid conflicts with png
    const oldWebpFiles = [
      path.join(mipmapDir, 'ic_launcher.webp'),
      path.join(mipmapDir, 'ic_launcher_round.webp'),
      path.join(mipmapDir, 'ic_launcher_foreground.webp'),
    ];
    for (const f of oldWebpFiles) {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    }

    // 3. splashscreen_logo.png
    const splashResized = splashImg.clone().resize(sizes.splash, sizes.splash, Jimp.RESIZE_BICUBIC);
    await splashResized.writeAsync(path.join(drawableDir, 'splashscreen_logo.png'));

    console.log(`Generated assets for ${density} (${sizes.icon}x${sizes.icon} icon, ${sizes.foreground}x${sizes.foreground} fg, ${sizes.splash}x${sizes.splash} splash)`);
  }

  console.log('All Android assets generated successfully!');
}

generate().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
