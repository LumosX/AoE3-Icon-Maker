import {
  singleFrames, mixedColours, mixedDescriptions,
} from './config.js';
import {
  sanitiseFilename, deriveUnitName, revokeIfSet, loadImagePromise, imageHasTransparency
} from './utils.js';
import {
  decodePngFileToRgba, imageFromRgba, extractAlphaAsGreyscale,
  sliceFrameHalf, composeFrameRawData, encodeRawPNG
} from './engine.js';
import { renderGrid, renderMixedRows, drawPreview, renderQuickExports } from './ui.js';

/* global JSZip */

// Reactive Set for tracking selections
class ReactiveSet extends Set {
  constructor(onChange, iterable) {
    super();
    this.onChange = onChange;
    if (iterable) {
      for (const item of iterable) {
        this.add(item);
      }
    }
  }
  add(value) {
    const r = super.add(value);
    if (this.onChange) this.onChange('add', value);
    return r;
  }
  delete(value) {
    const r = super.delete(value);
    if (this.onChange) this.onChange('delete', value);
    return r;
  }
  clear() {
    super.clear();
    if (this.onChange) this.onChange('clear');
  }
}

const dom = {
  unitNameInput: document.getElementById("unit-name"),
  singleGrid: document.getElementById("single-grid"),
  mixedGrid: document.getElementById("mixed-grid"),
  mixedTopList: document.getElementById("mixed-top-list"),
  mixedBottomList: document.getElementById("mixed-bottom-list"),
  previewPortrait: document.getElementById("preview-portrait"),
  previewMask: document.getElementById("preview-mask"),
  removeMaskBtn: document.getElementById("remove-mask"),
  mixedEmpty: document.getElementById("mixed-empty"),
  quickExportContainer: document.getElementById("quick-export-container"),
};

// Internal State container
const internalState = {
  portraitImage: null,
  alphaMaskImage: null,
  frameImages: {},
  mixedHalfImages: {},
  mixedBordersImage: null,
  portraitObjectUrl: null,
  maskObjectUrl: null,
  derivedUnitName: "settler_wagon",
  // Sets are initialised below
  selected: null,
  selectedTopColours: null,
  selectedBottomColours: null,
  mixedCombos: [],
};

// Reactive State Proxy
const state = new Proxy(internalState, {
  set(target, property, value) {
    target[property] = value;

    // React to property changes
    if (property === 'portraitImage' || property === 'alphaMaskImage') {
      refreshPreviews();
    }
    if (property === 'derivedUnitName') {
      updateTooltips();
    }

    return true;
  }
});

// Initialise Reactive Sets
state.selected = new ReactiveSet(null, singleFrames.map(f => f.id));
state.selectedTopColours = new ReactiveSet(() => regenerateMixedCombos());
state.selectedBottomColours = new ReactiveSet(() => regenerateMixedCombos());

const quickExportConfig = [
  {
    id: "download-game-format",
    label: "Download game-ready portrait + alpha (512×512)",
    classes: "bg-sky-600 hover:bg-sky-500 text-white",
    icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />',
    filenameId: "filename-game-format"
  },
  {
    id: "download-portrait-only",
    label: "Download portrait RGB (512×512)",
    classes: "bg-slate-800 border border-slate-700 hover:border-sky-400 hover:text-sky-200",
    icon: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />',
    filenameId: "filename-portrait-only"
  },
  {
    id: "download-mask-only",
    label: "Download mask (512×512)",
    classes: "bg-slate-800 border border-slate-700 hover:border-amber-400 hover:text-amber-200",
    icon: '<circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20" />',
    filenameId: "filename-mask-only"
  }
];

// Initialization logic
async function init() {
  try {
    await loadDefaults();
  } catch (e) {
    console.warn("Could not load default images (likely due to CORS or missing files):", e);
  }

  await loadAssets();
  buildMixedCheckboxes();

  // Initial Render
  renderGrid(singleFrames, dom.singleGrid, state, getFilename);
  renderQuickExports(quickExportConfig, dom.quickExportContainer);
  regenerateMixedCombos();
  updateTooltips();

  bindGlobalEvents();
}

async function loadDefaults() {
  state.portraitImage = await loadImagePromise(dom.previewPortrait.src);
  state.alphaMaskImage = await loadImagePromise(dom.previewMask.src);

  // this is overkill, lmao
  const getNameFromSrc = (src) => {
    try {
      return decodeURIComponent(src.split('/').pop());
    } catch (e) {
      return src.split('/').pop();
    }
  };

  document.getElementById("name-portrait").textContent = getNameFromSrc(dom.previewPortrait.src);
  document.getElementById("name-mask").textContent = getNameFromSrc(dom.previewMask.src);
  dom.removeMaskBtn.classList.remove("hidden");
}

async function loadAssets() {
  const promises = singleFrames.map(async frame => {
    if (!frame.src) return;
    try {
      const img = await loadImagePromise(frame.src);
      state.frameImages[frame.id] = img;
      state.mixedHalfImages[frame.id] = {
        top: sliceFrameHalf(img, "top"),
        bottom: sliceFrameHalf(img, "bottom")
      };
    }
    catch (e) { console.warn(e.message); }
  });

  try {
    state.mixedBordersImage = await loadImagePromise("frames/mixed_frame_borders.png");
  }
  catch (e) { console.warn("Mixed borders overlay missing."); }

  await Promise.all(promises);
}

function getFinalUnitName() {
  return sanitiseFilename(dom.unitNameInput.value.trim() || state.derivedUnitName);
}

function getFilename(frame) {
  const name = getFinalUnitName();
  return frame.filename ? frame.filename(name) : `${frame.id}_${name}.png`;
}

// Logic to redraw all canvas previews (faster than re-rendering DOM)
function refreshPreviews() {
  [...singleFrames, ...state.mixedCombos].forEach(frame => {
    drawPreview(frame, state.portraitImage, state.alphaMaskImage, state.frameImages, state.mixedHalfImages, state.mixedBordersImage);
  });
}

function regenerateMixedCombos() {
  // Clear old mixed selections
  for (const id of [...state.selected])
    if (id.startsWith("mixed-")) state.selected.delete(id);

  state.mixedCombos = [];
  const rows = [];

  mixedColours.forEach(topCol => {
    if (!state.selectedTopColours.has(topCol.id)) return;
    const framesInRow = [];
    mixedColours.forEach(bottomCol => {
      if (!state.selectedBottomColours.has(bottomCol.id) || topCol.id === bottomCol.id) return;

      const comboId = `mixed-${topCol.id}-${bottomCol.id}`;
      const meta = mixedDescriptions[`${topCol.id}-${bottomCol.id}`] || {};
      const frame = {
        id: comboId, isMixed: true, top: topCol.id, bottom: bottomCol.id,
        name: `${topCol.name} + ${bottomCol.name}`,
        usage: meta.usage || `Mixed frame: ${topCol.name} + ${bottomCol.name}`,
        description: meta.description || meta.usage,
        usesAlpha: false,
        filename: (unit) => `hc_${unit}_${topCol.id}_${bottomCol.id}.png`,
        examples: meta.examples || []
      };

      framesInRow.push(frame);
      state.mixedCombos.push(frame);
      state.selected.add(comboId);
    });

    if (framesInRow.length)
      rows.push({ topId: topCol.id, frames: framesInRow });
  });

  renderMixedRows(rows, dom.mixedGrid, state, getFilename);
  updateTooltips();
}

function buildMixedCheckboxes() {
  [dom.mixedTopList, dom.mixedBottomList].forEach((list, i) => {
    list.innerHTML = "";
    const activeSet = i === 0 ? state.selectedTopColours : state.selectedBottomColours;
    const action = i === 0 ? "toggle-mixed-top" : "toggle-mixed-bottom";

    mixedColours.forEach(col => {
      const label = document.createElement("label");
      label.className = "flex items-center gap-2 text-sm text-slate-200 cursor-pointer bg-slate-800/50 border border-slate-700 rounded-lg px-2 py-1.5";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = activeSet.has(col.id);
      input.className = "w-4 h-4 accent-sky-500";

      // Data attributes for delegation
      input.dataset.action = action;
      input.dataset.id = col.id;

      label.append(input, document.createTextNode(col.name));
      list.appendChild(label);
    });
  });
}

function updateTooltips() {
  const name = getFinalUnitName();
  document.getElementById("filename-game-format").textContent = `${name}_portrait_alpha.png`;
  document.getElementById("filename-portrait-only").textContent = `${name}_portrait.png`;
  document.getElementById("filename-mask-only").textContent = `${name}_mask.png`;

  document.querySelectorAll("[data-filename]").forEach(el => {
    const frame = [...singleFrames, ...state.mixedCombos]
      .find(f => f.id === el.dataset.frameId);

    if (frame)
      el.textContent = getFilename(frame);
  });
}

// --------------------------------------------------------------------------
// Global Event Delegation
// --------------------------------------------------------------------------
function bindGlobalEvents() {
  // Input Name Change
  dom.unitNameInput.addEventListener("input", updateTooltips);

  // Drag and Drop (requires specific handlers)
  handleDrop(document.getElementById("drop-portrait"), document.getElementById("input-portrait"), setPortrait, "name-portrait", dom.previewPortrait);
  handleDrop(document.getElementById("drop-mask"), document.getElementById("input-mask"), setMask, "name-mask", dom.previewMask);

  dom.removeMaskBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    clearAlphaMask();
  });

  // Global Click Handler
  document.addEventListener("click", (e) => {
    const target = e.target;

    // 1. Handle "data-action" clicks (Buttons/Checkboxes)
    const actionEl = target.closest("[data-action]");
    if (actionEl) {
      const action = actionEl.dataset.action;
      const id = actionEl.dataset.id;

      if (action === "select-single") {
        if (actionEl.checked)
          state.selected.add(id);
        else
          state.selected.delete(id);

        return;
      }
      if (action === "toggle-mixed-top") {
        if (actionEl.checked)
          state.selectedTopColours.add(id);
        else
          state.selectedTopColours.delete(id);

        return;
      }
      if (action === "toggle-mixed-bottom") {
        if (actionEl.checked)
          state.selectedBottomColours.add(id);
        else
          state.selectedBottomColours.delete(id);

        return;
      }
      if (action === "download-single") {
        const frame = [...singleFrames, ...state.mixedCombos].find(f => f.id === id);

        if (frame)
          handleSingleDownload(frame);

        return;
      }
    }

    // 2. Handle ID-based buttons (Static controls)
    const btnId = target.closest("button")?.id;
    if (!btnId) return;

    switch (btnId) {
      case "select-all":
        singleFrames.forEach(f => state.selected.add(f.id));
        syncCheckboxes("select-single", true);
        break;
      case "select-none":
        singleFrames.forEach(f => state.selected.delete(f.id));
        syncCheckboxes("select-single", false);
        break;
      case "select-all-mixed":
        mixedColours.forEach(c => { state.selectedTopColours.add(c.id); state.selectedBottomColours.add(c.id); });
        syncCheckboxes("toggle-mixed-top", true);
        syncCheckboxes("toggle-mixed-bottom", true);
        break;
      case "select-none-mixed":
        state.selectedTopColours.clear();
        state.selectedBottomColours.clear();
        syncCheckboxes("toggle-mixed-top", false);
        syncCheckboxes("toggle-mixed-bottom", false);
        break;
      case "download-selected-single":
        handleZip(singleFrames.filter(f => state.selected.has(f.id)).map(f => f.id));
        break;
      case "download-all-single":
        handleZip(singleFrames.map(f => f.id));
        break;
      case "download-mixed":
        handleZip(state.mixedCombos.map(f => f.id));
        break;
      case "download-all-global":
        handleZip([...singleFrames.filter(f => state.selected.has(f.id)).map(f => f.id), ...state.mixedCombos.map(f => f.id)]);
        break;
      case "download-portrait-only":
        handleSingleDownload({ id: "portrait", outputSize: 512, filename: n => `${n}_portrait.png` });
        break;
      case "download-game-format":
        handleSingleDownload({ id: "game", outputSize: 512, usesAlpha: true, filename: n => `${n}_portrait_alpha.png` });
        break;
      case "download-mask-only":
        if (state.alphaMaskImage) {
          const c = document.createElement("canvas"); c.width = 512; c.height = 512;
          c.getContext("2d").drawImage(state.alphaMaskImage, 0, 0, 512, 512);
          c.toBlob(b => downloadBlob(b, `${getFinalUnitName()}_mask.png`));
        }
        break;
      // "remove-mask" is now handled via direct listener above
    }
  });
}

function syncCheckboxes(actionType, checked) {
  document.querySelectorAll(`input[data-action="${actionType}"]`).forEach(el => el.checked = checked);
}

// --------------------------------------------------------------------------
// Logic (Download/Upload) - Largely unchanged, just using state.
// --------------------------------------------------------------------------

async function handleZip(ids) {
  const zip = new JSZip();
  let count = 0;

  for (const id of ids) {
    const frame = [...singleFrames, ...state.mixedCombos].find(f => f.id === id);
    if (!frame) continue;

    try {
        // Await the now-async high-quality composition
        const { data, width, height } = await composeFrameRawData(frame, state.portraitImage, state.alphaMaskImage, state.frameImages, state.mixedHalfImages, state.mixedBordersImage);
        zip.file(getFilename(frame), UPNG.encode([data.buffer], width, height, 0));
        count++;
    }
    catch (e) { console.warn(e); }
  }

  if (!count)
    return alert("No valid frames to download.");

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${getFinalUnitName()}_icons.zip`);
}

async function handleSingleDownload(frame) {
  try {
    // Await the now-async high-quality composition
    const { data, width, height } = await composeFrameRawData(frame, state.portraitImage, state.alphaMaskImage, state.frameImages, state.mixedHalfImages, state.mixedBordersImage);
    downloadBlob(encodeRawPNG(data, width, height), getFilename(frame));
  }
  catch (e) { alert(e.message); }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// File Handlers
function handleDrop(zone, input, setter, labelId, previewEl) {
  zone.onclick = (e) => {
    // Safety guard: if we somehow clicked a button inside (and propagation wasn't stopped), do nothing.
    if (e.target.closest("button")) return;
    input.click();
  };

  zone.ondragover = (e) => {
    e.preventDefault();
    zone.classList.add("ring-2", "ring-sky-500");
  };

  zone.ondragleave = () => zone.classList.remove("ring-2", "ring-sky-500");

  zone.ondrop = (e) => {
    e.preventDefault();
    zone.classList.remove("ring-2", "ring-sky-500");

    if (e.dataTransfer.files[0])
      setter(e.dataTransfer.files[0], labelId, previewEl);
  };

  input.onchange = (e) => {
    if (e.target.files[0])
      setter(e.target.files[0], labelId, previewEl);
  };
}

async function setPortrait(file, labelId, previewEl) {
  document.getElementById(labelId).textContent = file.name;
  const guess = deriveUnitName(file.name);

  if (guess) {
    state.derivedUnitName = guess;
    if (!dom.unitNameInput.value.trim())
      dom.unitNameInput.placeholder = guess;
  }

  if (file.type === "image/png") {
    const { width, height, rgba } = await decodePngFileToRgba(file);
    let alpha = false;

    for (let i = 3; i < rgba.length; i += 4)
      if (rgba[i] < 255) {
        alpha = true;
        break;
      }

    if (alpha) {
      const pR = new Uint8Array(rgba.length);
      const mR = new Uint8Array(rgba.length);

      for (let i = 0; i < rgba.length; i += 4) {
        pR[i] = rgba[i];
        pR[i + 1] = rgba[i + 1];
        pR[i + 2] = rgba[i + 2];
        pR[i + 3] = 255;

        const a = rgba[i + 3];
        mR[i] = a;
        mR[i + 1] = a;
        mR[i + 2] = a;
        mR[i + 3] = 255;
      }

      revokeIfSet(state.portraitObjectUrl);
      const pb = imageFromRgba(width, height, pR);
      state.portraitObjectUrl = pb.url;

      pb.img.onload = () => {
        state.portraitImage = pb.img;
        previewEl.src = pb.img.src;
      };

      revokeIfSet(state.maskObjectUrl);
      const mb = imageFromRgba(width, height, mR);
      state.maskObjectUrl = mb.url;

      mb.img.onload = () => {
        state.alphaMaskImage = mb.img; dom.previewMask.src = mb.img.src;
        dom.previewMask.classList.remove("cleared-mask-style");
        document.getElementById("name-mask").textContent = file.name + " (auto-split mask)";
        dom.removeMaskBtn.classList.remove("hidden");
      };

      return;
    }
  }

  const img = await loadImagePromise(URL.createObjectURL(file));
  state.portraitImage = img; previewEl.src = img.src;
}

async function setMask(file, labelId, previewEl) {
  document.getElementById(labelId).textContent = file.name;
  previewEl.classList.remove("cleared-mask-style");

  if (file.type === "image/png") {
    const { width, height, rgba } = await decodePngFileToRgba(file);
    let hasAlpha = false;

    for (let i = 3; i < rgba.length; i += 4)
      if (rgba[i] < 255) {
        hasAlpha = true;
        break;
      }

    if (hasAlpha) {
      const mR = new Uint8Array(rgba.length);
      for (let i = 0; i < rgba.length; i += 4) {
        const a = rgba[i + 3];
        mR[i] = a;
        mR[i + 1] = a;
        mR[i + 2] = a;
        mR[i + 3] = 255;
      }

      revokeIfSet(state.maskObjectUrl);
      const mb = imageFromRgba(width, height, mR);
      state.maskObjectUrl = mb.url;

      mb.img.onload = () => {
        state.alphaMaskImage = mb.img;
        previewEl.src = mb.img.src;
        dom.removeMaskBtn.classList.remove("hidden");
      };

      return;
    }
  }

  const img = await loadImagePromise(URL.createObjectURL(file));

  if (imageHasTransparency(img)) {
    const c = extractAlphaAsGreyscale(img);
    const m = await loadImagePromise(c.toDataURL());
    state.alphaMaskImage = m;
    previewEl.src = m.src;
  }
  else {
    state.alphaMaskImage = img; previewEl.src = img.src;
  }

  dom.removeMaskBtn.classList.remove("hidden");
}

function clearAlphaMask() {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;

  const ctx = c.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 1, 1);
  const whiteImg = new Image();

  whiteImg.onload = () => {
    revokeIfSet(state.maskObjectUrl);
    state.maskObjectUrl = null;
    state.alphaMaskImage = whiteImg;
    dom.previewMask.src = whiteImg.src;
    dom.previewMask.classList.add("cleared-mask-style");

    document.getElementById("name-mask").textContent = "[cleared mask]";
    dom.removeMaskBtn.classList.add("hidden");
  };
  whiteImg.src = c.toDataURL();
}

init();