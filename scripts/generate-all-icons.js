const Jimp = require('jimp-compact');
const path = require('path');
const fs = require('fs');

const USER_SRC = 'C:/Users/USER/.gemini/antigravity/brain/baa39647-accb-4562-b96b-5200da89353e/.user_uploaded/media_1792861384974_949a4328.png';
const ROOT_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT_DIR, 'assets');
const RES_DIR = path.join(ROOT_DIR, 'android', 'app', 'src', 'main', 'res');
const DESKTOP_DIR = 'C:/Users/USER/Desktop';

async function generate() {
  console.log('Reading source image from:', USER_SRC);
  if (!fs.existsSync(USER_SRC)) {
    throw new Error('User source file not found: ' + USER_SRC);
  }

  const rawImg = await Jimp.read(USER_SRC);
  console.log(`Loaded image: ${rawImg.bitmap.width}x${rawImg.bitmap.height}`);

  // 1. Extract the white emblem cleanly
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

  // 2. Generate Google Play Store 512x512 full bleed icon (Google Play requires no transparency / full bleed square)
  console.log('Generating Google Play Store 512x512 full-bleed icon...');
  const playStoreSolid512 = new Jimp(512, 512, 0x1B21A8FF);
  // Scale emblem to ~414px wide on 512 canvas (same ratio as rawImg)
  const psEmblemW = 414;
  const psEmblemH = Math.round(emblemH * (psEmblemW / emblemW));
  const psEmblem = croppedEmblem.clone().resize(psEmblemW, psEmblemH, Jimp.RESIZE_BICUBIC);
  const psX = Math.round((512 - psEmblemW) / 2);
  const psY = Math.round((512 - psEmblemH) / 2);
  playStoreSolid512.composite(psEmblem, psX, psY);

  await playStoreSolid512.writeAsync(path.join(ROOT_DIR, 'play-store-icon-512x512.png'));
  if (fs.existsSync(DESKTOP_DIR)) {
    await playStoreSolid512.writeAsync(path.join(DESKTOP_DIR, 'MessagePro-PlayStore-Icon-512x512.png'));
    await rawImg.writeAsync(path.join(DESKTOP_DIR, 'MessagePro-PlayStore-Icon-Squircle-512x512.png'));
  }

  // 3. Generate assets/icon-squircle.png (1024x1024 squircle)
  console.log('Generating assets/icon-squircle.png (1024x1024)...');
  const iconSquircle = rawImg.clone().resize(1024, 1024, Jimp.RESIZE_BICUBIC);
  await iconSquircle.writeAsync(path.join(ASSETS_DIR, 'icon-squircle.png'));

  // 4. Generate assets/icon.png (1024x1024 solid #1B21A8 for iOS / general)
  console.log('Generating assets/icon.png (1024x1024 solid #1B21A8)...');
  const solidBlue1024 = new Jimp(1024, 1024, 0x1B21A8FF);
  const emblem1024W = 828;
  const emblem1024H = Math.round(emblemH * (emblem1024W / emblemW));
  const emblem1024 = croppedEmblem.clone().resize(emblem1024W, emblem1024H, Jimp.RESIZE_BICUBIC);
  const e1024X = Math.round((1024 - emblem1024W) / 2);
  const e1024Y = Math.round((1024 - emblem1024H) / 2);
  solidBlue1024.composite(emblem1024, e1024X, e1024Y);
  await solidBlue1024.writeAsync(path.join(ASSETS_DIR, 'icon.png'));

  // 5. Generate assets/adaptive-icon.png & assets/android-icon-foreground.png (safe zone 580px)
  console.log('Generating adaptive-icon.png and android-icon-foreground.png...');
  const fgTargetW = 580;
  const fgTargetH = Math.round(emblemH * (fgTargetW / emblemW));
  const fgEmblem = croppedEmblem.clone().resize(fgTargetW, fgTargetH, Jimp.RESIZE_BICUBIC);
  const fgCanvas = new Jimp(1024, 1024, 0x00000000);
  const fgX = Math.round((1024 - fgTargetW) / 2);
  const fgY = Math.round((1024 - fgTargetH) / 2);
  fgCanvas.composite(fgEmblem, fgX, fgY);

  await fgCanvas.writeAsync(path.join(ASSETS_DIR, 'adaptive-icon.png'));
  await fgCanvas.writeAsync(path.join(ASSETS_DIR, 'android-icon-foreground.png'));

  // 6. Generate assets/android-icon-background.png (1024x1024 solid #1B21A8)
  console.log('Generating assets/android-icon-background.png...');
  const androidBg = new Jimp(1024, 1024, 0x1B21A8FF);
  await androidBg.writeAsync(path.join(ASSETS_DIR, 'android-icon-background.png'));

  // 7. Generate assets/favicon.png (48x48)
  console.log('Generating assets/favicon.png (48x48)...');
  const favicon = iconSquircle.clone().resize(48, 48, Jimp.RESIZE_BICUBIC);
  await favicon.writeAsync(path.join(ASSETS_DIR, 'favicon.png'));

  // 8. Generate assets/splash-icon.png
  console.log('Generating assets/splash-icon.png...');
  await fgCanvas.writeAsync(path.join(ASSETS_DIR, 'splash-icon.png'));

  // 9. Generate Android mipmap densities and drawables
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

    // ic_launcher_round.png (circular cut with comfortable safe padding so emblem doesn't get clipped)
    // Scale emblem to ~68% of round icon diameter
    const roundCanvas = new Jimp(sizes.icon, sizes.icon, 0x1B21A8FF);
    const rEmblemW = Math.round(sizes.icon * 0.72);
    const rEmblemH = Math.round(emblemH * (rEmblemW / emblemW));
    const rEmblem = croppedEmblem.clone().resize(rEmblemW, rEmblemH, Jimp.RESIZE_BICUBIC);
    const rX = Math.round((sizes.icon - rEmblemW) / 2);
    const rY = Math.round((sizes.icon - rEmblemH) / 2);
    roundCanvas.composite(rEmblem, rX, rY);
    roundCanvas.circle();
    await roundCanvas.writeAsync(path.join(mipmapDir, 'ic_launcher_round.png'));

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

  console.log('All icons generated successfully!');
}

generate().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
