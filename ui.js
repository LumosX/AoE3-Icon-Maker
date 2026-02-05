import { FRAME_SIZE, BORDER_THICKNESS, PORTRAIT_SIZE } from './config.js';
import { scaleToSquare } from './utils.js';
import { composeWithAlphaMask } from './engine.js';

export function drawPreview(frame, portraitImage, alphaMaskImage, frameImages, mixedHalfImages, mixedBordersImage) {
  const canvas = document.querySelector(`[data-canvas-id="${frame.id}"]`);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  ctx.clearRect(0, 0, FRAME_SIZE, FRAME_SIZE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const portraitTargetSize = (frame.src || frame.isMixed) && !frame.fullSizePortrait ? PORTRAIT_SIZE : FRAME_SIZE;

  if (portraitImage && alphaMaskImage && frame.usesAlpha) {
    const composed = composeWithAlphaMask(portraitImage, alphaMaskImage, portraitTargetSize);
    const x = (FRAME_SIZE - portraitTargetSize) / 2;
    const y = (FRAME_SIZE - portraitTargetSize) / 2;
    ctx.drawImage(composed, x, y, portraitTargetSize, portraitTargetSize);
  }
  else if (portraitImage) {
    const [w, h] = scaleToSquare(portraitImage, portraitTargetSize);
    const x = (FRAME_SIZE - w) / 2;
    const y = (FRAME_SIZE - h) / 2;
    ctx.drawImage(portraitImage, x, y, w, h);
  }
  else {
    ctx.clearRect(BORDER_THICKNESS, BORDER_THICKNESS, PORTRAIT_SIZE, PORTRAIT_SIZE);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No Image", FRAME_SIZE / 2, FRAME_SIZE / 2 + 4);
  }

  if (frame.isMixed) {
    const topImg = mixedHalfImages[frame.top]?.top;
    const bottomImg = mixedHalfImages[frame.bottom]?.bottom;
    if (topImg) ctx.drawImage(topImg, 0, 0, FRAME_SIZE, FRAME_SIZE);
    if (bottomImg) ctx.drawImage(bottomImg, 0, 0, FRAME_SIZE, FRAME_SIZE);
    if (mixedBordersImage) ctx.drawImage(mixedBordersImage, 0, 0, FRAME_SIZE, FRAME_SIZE);
  }
  else if (frame.src && frameImages[frame.id]) {
    ctx.drawImage(frameImages[frame.id], 0, 0, FRAME_SIZE, FRAME_SIZE);
  }
}

function createFrameNode(frame, template, state, getFilename) {
  const node = template.content.cloneNode(true);
  node.querySelector("[data-name]").textContent = frame.name;
  node.querySelector("[data-usage]").textContent = frame.usage;

  // Handle description formatting (newlines + indentation)
  const descEl = node.querySelector("[data-description]");
  const descText = frame.description || frame.usage || "";

  descEl.innerHTML = "";
  // Split, trim, and remove empty lines first to ensure index 0 is the first visual paragraph
  const lines = descText.split("\n").map(l => l.trim()).filter(l => l);

  lines.forEach((line, index) => {
    const p = document.createElement("p");
    p.textContent = line;
    // Only indent subsequent paragraphs (index > 0)
    p.className = `${index > 0 ? "indent-4" : ""} mb-1 last:mb-0`;
    descEl.appendChild(p);
  });

  const fnEl = node.querySelector("[data-filename]");
  fnEl.textContent = getFilename(frame);
  fnEl.dataset.frameId = frame.id;

  const checkbox = node.querySelector("[data-check]");
  if (frame.isMixed) {
    checkbox?.closest("label")?.remove();
  }
  else {
    checkbox.checked = state.selected.has(frame.id);
    // Add data attribute for event delegation
    checkbox.dataset.action = "select-single";
    checkbox.dataset.id = frame.id;
  }

  const examplesElement = node.querySelector("[data-examples]");
  examplesElement.innerHTML = "";

  const examples = frame.examples || [];
  examples.forEach(ex => {
    const li = document.createElement("li");
    li.className = "truncate";

    if (ex.url) {
      const link = document.createElement("a");
      link.href = ex.url; link.target = "_blank"; link.rel = "noopener noreferrer";
      link.className = "text-sky-400 hover:text-sky-300 hover:underline transition-colors";
      link.textContent = ex.label; li.appendChild(link);
    }
    else {
      li.textContent = ex.label;
    }

    examplesElement.appendChild(li);
  });

  if (examples.length === 0) {
    const p = document.createElement("p");
    p.className = "italic";
    p.textContent = "No examples listed";
    examplesElement.appendChild(p);
  }

  const canvas = node.querySelector("[data-canvas]");
  canvas.dataset.canvasId = frame.id;

  // Add data attribute for event delegation
  const downloadBtn = node.querySelector("[data-download]");
  downloadBtn.dataset.action = "download-single";
  downloadBtn.dataset.id = frame.id;

  return node;
}

export function renderGrid(list, container, state, getFilename) {
  container.innerHTML = "";
  const template = document.getElementById("frame-card-template");

  list.forEach(frame => {
    container.appendChild(createFrameNode(frame, template, state, getFilename));
    drawPreview(frame, state.portraitImage, state.alphaMaskImage, state.frameImages, state.mixedHalfImages, state.mixedBordersImage);
  });
}

export function renderMixedRows(rows, container, state, getFilename) {
  container.innerHTML = "";
  const emptyState = document.getElementById("mixed-empty");
  const template = document.getElementById("frame-card-template");

  if (!rows.length) {
    emptyState.classList.remove("hidden");
    return;
  }
  emptyState.classList.add("hidden");

  rows.forEach(row => {
    const rowWrap = document.createElement("div");
    rowWrap.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2";
    container.appendChild(rowWrap);

    row.frames.forEach(frame => {
      rowWrap.appendChild(createFrameNode(frame, template, state, getFilename));
      drawPreview(frame, state.portraitImage, state.alphaMaskImage, state.frameImages, state.mixedHalfImages, state.mixedBordersImage);
    });
  });
}

export function renderQuickExports(config, container) {
  const template = document.getElementById("quick-export-template");
  container.innerHTML = "";

  config.forEach(item => {
    const node = template.content.cloneNode(true);
    const btn = node.querySelector("[data-btn]");
    btn.id = item.id;
    // Append specific classes to base classes
    item.classes.split(" ").forEach(c => btn.classList.add(c));

    const icon = node.querySelector("[data-icon]");
    icon.innerHTML = item.icon;

    node.querySelector("[data-label]").textContent = item.label;

    const fn = node.querySelector("[data-filename]");
    fn.id = item.filenameId;

    container.appendChild(node);
  });
}