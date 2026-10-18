const Jimp = require('jimp-compact');
const path = require('path');
const fs = require('fs');

const DESKTOP_SRC = 'C:/Users/USER/Desktop/New folder (4)/favicon white@4x2.png';
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

async function run() {
  console.log('Reading source image from desktop:', DESKTOP_SRC);
  if (!fs.existsSync(DESKTOP_SRC)) {
    throw new Error('Desktop source file not found: ' + DESKTOP_SRC);
  }

  const rawImg = await Jimp.read(DESKTOP_SRC);
  console.log(`Loaded image: ${rawImg.bitmap.width}x${rawImg.bitmap.height}`);

  // 1. Generate assets/icon-squircle.png (1024x1024 with squircle and transparent corners)
  console.log('Generating assets/icon-squircle.png (1024x1024)...');
  const iconSquircle = rawImg.clone().resize(1024, 1024, Jimp.RESIZE_BICUBIC);
  await iconSquircle.writeAsync(path.join(ASSETS_DIR, 'icon-squircle.png'));

  // 2. Extract the white emblem cleanly (anything white with alpha > 100)
  console.log('Extracting white emblem from source...');
  const emblemOnly = new Jimp(rawImg.bitmap.width, rawImg.bitmap.height, 0x00000000);
  let minX = rawImg.bitmap.width, maxX = 0, minY = rawImg.bitmap.height, maxY = 0;

  rawImg.scan(0, 0, rawImg.bitmap.width, rawImg.bitmap.height, function(x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const a = this.bitmap.data[idx + 3];

    // White emblem pixels in the source
    if (a > 100 && r > 200 && g > 200 && b > 200) {
      emblemOnly.bitmap.data[idx] = r;
      emblemOnly.bitmap.data[idx + 1] = g;
      emblemOnly.bitmap.data[idx + 2] = b;
      emblemOnly.bitmap.data[idx + 3] = a;

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  });

  const emblemW = maxX - minX + 1;
  const emblemH = maxY - minY + 1;
  console.log(`Emblem bounding box: ${emblemW}x${emblemH} at (${minX}, ${minY})`);

  const croppedEmblem = emblemOnly.clone().crop(minX, minY, emblemW, emblemH);

  // 3. Generate assets/icon.png (1024x1024, FULL BLEED SOLID #1B21A8, NO TRANSPARENCY for iOS)
  console.log('Generating assets/icon.png (1024x1024, solid #1B21A8)...');
  const solidBlueBg = new Jimp(1024, 1024, 0x1B21A8FF);
  // Scale emblem to fit comfortably inside 1024x1024 (width 828, proportional height ~448)
  const iosEmblemW = 828;
  const iosEmblemH = Math.round(emblemH * (iosEmblemW / emblemW));
  const iosEmblem = croppedEmblem.clone().resize(iosEmblemW, iosEmblemH, Jimp.RESIZE_BICUBIC);
  const iosX = Math.round((1024 - iosEmblemW) / 2);
  const iosY = Math.round((1024 - iosEmblemH) / 2);
  solidBlueBg.composite(iosEmblem, iosX, iosY);
  await solidBlueBg.writeAsync(path.join(ASSETS_DIR, 'icon.png'));

  // 4. Generate assets/adaptive-icon.png & assets/android-icon-foreground.png
  // Adaptive icon safe zone is 66% (circle of 675px within 1024).
  // Target width 580px fits safely in all launcher shapes.
  console.log('Generating adaptive-icon.png & android-icon-foreground.png (safe zone 580px)...');
  const fgTargetW = 580;
  const fgTargetH = Math.round(emblemH * (fgTargetW / emblemW));
  const fgEmblem = croppedEmblem.clone().resize(fgTargetW, fgTargetH, Jimp.RESIZE_BICUBIC);
  const fgCanvas = new Jimp(1024, 1024, 0x00000000);
  const fgX = Math.round((1024 - fgTargetW) / 2);
  const fgY = Math.round((1024 - fgTargetH) / 2);
  fgCanvas.composite(fgEmblem, fgX, fgY);

  await fgCanvas.writeAsync(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  await fgCanvas.writeAsync(path.join(ASSETS_DIR, 'android-icon-foreground.png'));

  // 5. Generate assets/android-icon-background.png (1024x1024 solid #1B21A8)
  console.log('Generating assets/android-icon-background.png...');
  const androidBg = new Jimp(1024, 1024, 0x1B21A8FF);
  await androidBg.writeAsync(path.join(ASSETS_DIR, 'android-icon-background.png'));

  // 6. Generate assets/favicon.png (48x48)
  console.log('Generating assets/favicon.png (48x48)...');
  const favicon = iconSquircle.clone().resize(48, 48, Jimp.RESIZE_BICUBIC);
  await favicon.writeAsync(path.join(ASSETS_DIR, 'favicon.png'));

  // 7. Generate Android mipmap densities and drawables
  console.log('Generating Android res mipmaps and drawables...');
  const DENSITIES = {
    mdpi: { icon: 48, foreground: 108, splash: 200 },
    hdpi: { icon: 72, foreground: 162, splash: 300 },
    xhdpi: { icon: 96, foreground: 216, splash: 400 },
    xxhdpi: { icon: 144, foreground: 324, splash: 600 },
    xxxhdpi: { icon: 192, foreground: 432, splash: 800 },
  };

  for (const [density, sizes] of Object.entries(DENSITIES)) {
    const mipmapDir = path.join(RES_DIR, `mipmap-${density}`);
    const drawableDir = path.join(RES_DIR, `drawable-${density}`);

    if (!fs.existsSync(mipmapDir)) fs.mkdirSync(mipmapDir, { recursive: true });
    if (!fs.existsSync(drawableDir)) fs.mkdirSync(drawableDir, { recursive: true });

    // ic_launcher.png (squircle)
    const icLauncher = iconSquircle.clone().resize(sizes.icon, sizes.icon, Jimp.RESIZE_BICUBIC);
    await icLauncher.writeAsync(path.join(mipmapDir, 'ic_launcher.png'));

    // ic_launcher_round.png (circular cut of solid blue icon)
    const icRound = solidBlueBg.clone().resize(sizes.icon, sizes.icon, Jimp.RESIZE_BICUBIC).circle();
    await icRound.writeAsync(path.join(mipmapDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    const icFg = fgCanvas.clone().resize(sizes.foreground, sizes.foreground, Jimp.RESIZE_BICUBIC);
    await icFg.writeAsync(path.join(mipmapDir, 'ic_launcher_foreground.png'));

    // splashscreen_logo.png
    const splashLogo = fgCanvas.clone().resize(sizes.splash, sizes.splash, Jimp.RESIZE_BICUBIC);
    await splashLogo.writeAsync(path.join(drawableDir, 'splashscreen_logo.png'));

    // Delete any old .webp icons that might take precedence in Android builds
    ['ic_launcher.webp', 'ic_launcher_round.webp', 'ic_launcher_foreground.webp'].forEach(f => {
      const p = path.join(mipmapDir, f);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });

    console.log(`Generated for mipmap-${density}`);
  }

  console.log('Done! All assets generated successfully from Desktop file.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
