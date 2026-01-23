export function sanitiseFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]+/g, "")  // Remove invalid filename characters
    .replace(/[\s-]+/g, "_")         // Spaces/dashes to underscores
    .replace(/_+/g, "_")             // Collapse multiple underscores
    .replace(/^_+|_+$/g, "");        // Trim leading/trailing underscores
}

export function deriveUnitName(path) {
  if (!path) return "";
  const name = path.split("/").pop()?.split("\\").pop() || "";
  let base = name.replace(/\.[^.]+$/, "");

  const stringsToRemove = [
    "_portrait", "_transparent", "_icon", "_alpha", "_mask",
    "portrait", "transparent", "icon", "alpha", "mask"
  ];

  for (const str of stringsToRemove) {
    const regex = new RegExp(str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    base = base.replace(regex, '');
  }

  return base
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function scaleToSquare(img, target) {
  if (!img?.width || !img?.height)
    return [target, target];

  const ratio = Math.min(target / img.width, target / img.height);
  return [img.width * ratio, img.height * ratio];
}

export function revokeIfSet(url) {
  if (url) {
    try { URL.revokeObjectURL(url); } catch { }
  }
}

// Utility for async image loading
export function loadImagePromise(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// Check if an image has any transparent pixels
export function imageHasTransparency(img) {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const data = imageData.data;

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}
