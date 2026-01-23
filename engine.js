import { FRAME_SIZE, PORTRAIT_SIZE } from './config.js';
import { scaleToSquare } from './utils.js';

/* global UPNG */

// Canvas Pool to prevent garbage collection churn during batch operations
const CANVAS_POOL = {
  c1: null, // General purpose 1
  c2: null, // General purpose 2
  c3: null, // General purpose 3
};

function getPooledCanvas(id, size) {
  if (!CANVAS_POOL[id]) {
    CANVAS_POOL[id] = document.createElement("canvas");
  }

  const c = CANVAS_POOL[id];

  // Resize if necessary (clears content automatically)
  if (c.width !== size || c.height !== size) {
    c.width = size;
    c.height = size;
  }
  else {
    // Manually clear if size didn't change
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, size, size);
  }

  // Return canvas and context (optimized for readback)
  return {
    canvas: c,
    ctx: c.getContext("2d", { willReadFrequently: true })
  };
}

// Helper to draw a resized image using native browser API for best quality (Lanczos/Bicubic)
async function drawResizedImage(ctx, source, width, height, x = 0, y = 0) {
  // Ensure dimensions are integers and at least 1px
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));

  // resizeQuality: 'high' forces high-quality resampling (e.g. Lanczos) even in Firefox
  const bmp = await createImageBitmap(source, {
    resizeWidth: w,
    resizeHeight: h,
    resizeQuality: 'high'
  });

  ctx.drawImage(bmp, x, y);
  bmp.close();
}

// Decode a PNG file to raw RGBA via UPNG (bypasses canvas premultiplication)
export async function decodePngFileToRgba(file) {
  const buf = await file.arrayBuffer();
  const png = UPNG.decode(buf);
  const rgba = UPNG.toRGBA8(png)[0];
  return { width: png.width, height: png.height, rgba: new Uint8Array(rgba) };
}

// Create an Image from raw RGBA data (encoded via UPNG)
export function imageFromRgba(width, height, rgba) {
  const pngBytes = UPNG.encode([rgba.buffer], width, height, 0);
  const blob = new Blob([pngBytes], { type: "image/png" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = url;
  return { img, url };
}

// Extract alpha channel as a greyscale image
export function extractAlphaAsGreyscale(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    data[i] = alpha;
    data[i + 1] = alpha;
    data[i + 2] = alpha;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return c;
}

// Compose portrait with alpha mask using pooled canvases
export function composeWithAlphaMask(portrait, mask, targetSize) {
  // Use c1 for output, c2 for mask resizing
  const { canvas: c, ctx } = getPooledCanvas('c1', targetSize);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const [pw, ph] = scaleToSquare(portrait, targetSize);
  ctx.drawImage(portrait, (targetSize - pw) / 2, (targetSize - ph) / 2, pw, ph);

  const portraitData = ctx.getImageData(0, 0, targetSize, targetSize);

  const { canvas: maskCanvas, ctx: maskCtx } = getPooledCanvas('c2', targetSize);
  maskCtx.imageSmoothingEnabled = true;
  maskCtx.imageSmoothingQuality = "high";

  const [mw, mh] = scaleToSquare(mask, targetSize);
  maskCtx.drawImage(mask, (targetSize - mw) / 2, (targetSize - mh) / 2, mw, mh);
  const maskData = maskCtx.getImageData(0, 0, targetSize, targetSize);

  const pData = portraitData.data;
  const mData = maskData.data;
  for (let i = 0; i < pData.length; i += 4) {
    pData[i + 3] = mData[i];
  }

  ctx.putImageData(portraitData, 0, 0);
  return c;
}

// Create synthetic mixed halves
// Note: This creates persistent assets, so we do NOT use the pool here to avoid overwriting.
export function sliceFrameHalf(frameImg, which) {
  if (!frameImg) return null;
  const c = document.createElement("canvas");
  c.width = FRAME_SIZE; c.height = FRAME_SIZE;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);
  ctx.drawImage(frameImg, 0, 0, FRAME_SIZE, FRAME_SIZE);

  ctx.globalCompositeOperation = "destination-in";
  ctx.beginPath();

  if (which === "top") {
    ctx.moveTo(0, 0); ctx.lineTo(FRAME_SIZE, 0); ctx.lineTo(FRAME_SIZE, FRAME_SIZE); ctx.lineTo(0, 0);
  }
  else {
    ctx.moveTo(0, FRAME_SIZE); ctx.lineTo(FRAME_SIZE, FRAME_SIZE); ctx.lineTo(0, 0); ctx.lineTo(0, FRAME_SIZE);
  }

  ctx.closePath();
  ctx.fill();
  return c;
}

// Build raw RGBA data to avoid premultiplied alpha corruption
// NOW ASYNC to support high-quality bitmap resizing
export async function composeFrameRawData(frame, portraitImage, alphaMaskImage, frameImages, mixedHalfImages, mixedBordersImage) {
  const outputSize = frame.outputSize || FRAME_SIZE;
  const hasFrame = frame.src || frame.isMixed;
  const portraitTargetSize = (hasFrame && !frame.fullSizePortrait)
    ? Math.round(outputSize * (PORTRAIT_SIZE / FRAME_SIZE))
    : outputSize;

  const output = new Uint8Array(outputSize * outputSize * 4);

  // Step 1: Read portrait RGB (Use c1)
  const { ctx: pCtx } = getPooledCanvas('c1', portraitTargetSize);

  const [pw, ph] = scaleToSquare(portraitImage, portraitTargetSize);
  const w = Math.max(1, Math.round(pw));
  const h = Math.max(1, Math.round(ph));
  await drawResizedImage(pCtx, portraitImage, pw, ph, (portraitTargetSize - w) / 2, (portraitTargetSize - h) / 2);

  const portraitData = pCtx.getImageData(0, 0, portraitTargetSize, portraitTargetSize).data;

  // Step 2: Read mask alpha (Use c2)
  const usesAlpha = frame.usesAlpha || false;
  let maskData;
  if (usesAlpha) {
    const { ctx: mCtx } = getPooledCanvas('c2', portraitTargetSize);

    const [mw, mh] = scaleToSquare(alphaMaskImage, portraitTargetSize);
    const wMask = Math.max(1, Math.round(mw));
    const hMask = Math.max(1, Math.round(mh));
    await drawResizedImage(mCtx, alphaMaskImage, mw, mh, (portraitTargetSize - wMask) / 2, (portraitTargetSize - hMask) / 2);

    maskData = mCtx.getImageData(0, 0, portraitTargetSize, portraitTargetSize).data;
  }

  // Step 3: Combine RGB + Alpha
  const offset = Math.round((outputSize - portraitTargetSize) / 2);
  for (let y = 0; y < portraitTargetSize; y++) {
    for (let x = 0; x < portraitTargetSize; x++) {
      const srcIdx = (y * portraitTargetSize + x) * 4;
      const dstIdx = ((y + offset) * outputSize + (x + offset)) * 4;
      output[dstIdx] = portraitData[srcIdx];
      output[dstIdx + 1] = portraitData[srcIdx + 1];
      output[dstIdx + 2] = portraitData[srcIdx + 2];
      output[dstIdx + 3] = usesAlpha ? maskData[srcIdx] : 255;
    }
  }

  // Step 4: Overlays (Use c3)
  if (hasFrame) {
    const { ctx: fCtx } = getPooledCanvas('c3', outputSize);

    if (frame.isMixed) {
      const topImg = mixedHalfImages[frame.top]?.top;
      const bottomImg = mixedHalfImages[frame.bottom]?.bottom;

      // Resize layers to output size (usually upscaling 128->512 or keeping 128->128)
      if (topImg) {
        await drawResizedImage(fCtx, topImg, outputSize, outputSize);
      }
      if (bottomImg) {
        await drawResizedImage(fCtx, bottomImg, outputSize, outputSize);
      }
      if (mixedBordersImage) {
        await drawResizedImage(fCtx, mixedBordersImage, outputSize, outputSize);
      }
    }
    else if (frameImages[frame.id]) {
      await drawResizedImage(fCtx, frameImages[frame.id], outputSize, outputSize);
    }

    const frameData = fCtx.getImageData(0, 0, outputSize, outputSize).data;
    for (let i = 0; i < output.length; i += 4) {
      const fA = frameData[i + 3] / 255;
      if (fA > 0) {
        const pA = output[i + 3] / 255;
        const outA = fA + pA * (1 - fA);
        if (outA > 0) {
          output[i] = Math.round((frameData[i] * fA + output[i] * pA * (1 - fA)) / outA);
          output[i + 1] = Math.round((frameData[i + 1] * fA + output[i + 1] * pA * (1 - fA)) / outA);
          output[i + 2] = Math.round((frameData[i + 2] * fA + output[i + 2] * pA * (1 - fA)) / outA);
        }
        output[i + 3] = Math.round(outA * 255);
      }
    }
  }

  return { data: output, width: outputSize, height: outputSize };
}

export function encodeRawPNG(data, width, height) {
  const png = UPNG.encode([data.buffer], width, height, 0);
  return new Blob([png], { type: "image/png" });
}