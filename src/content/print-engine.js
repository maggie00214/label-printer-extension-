(() => {
  if (window.LabelPrinterEngine) return;

  const DEFAULT_SETTINGS = {
    enabled: true,
    autoPrint: true,
    skipBlankLabels: true,
    debugMode: false,
    printDelayMs: 800,
    familymartScalePercent: 90,
    familymartEnabled: true,
    sevenElevenEnabled: true
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function getSettings() {
    try {
      return await chrome.storage.sync.get(DEFAULT_SETTINGS);
    } catch (error) {
      console.warn("[LabelPrinter] Failed to read settings, using defaults.", error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  function markOnce(key) {
    const attr = `data-label-printer-${key}`;
    if (document.documentElement.hasAttribute(attr)) return false;
    document.documentElement.setAttribute(attr, "true");
    return true;
  }

  function log(settings, ...args) {
    if (settings && settings.debugMode) {
      console.log("[LabelPrinter]", ...args);
    }
  }

  async function waitForImages(images, timeoutMs = 6000) {
    const pending = images
      .filter((img) => !img.complete || !img.naturalWidth)
      .map((img) => new Promise((resolve) => {
        const timer = setTimeout(resolve, timeoutMs);
        const done = () => {
          clearTimeout(timer);
          resolve();
        };
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }));

    await Promise.all(pending);
  }

  function replaceBodyWith(nodes, className) {
    document.body.innerHTML = "";
    if (className) document.body.classList.add(className);
    for (const node of nodes) {
      document.body.appendChild(node);
    }
  }

  function createCanvas(width, height, className) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(width));
    canvas.height = Math.max(1, Math.floor(height));
    if (className) canvas.className = className;
    return canvas;
  }

  function drawImageSlice(img, sourceX, sourceY, sourceWidth, sourceHeight, className) {
    const canvas = createCanvas(sourceWidth, sourceHeight, className);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height
    );
    return canvas;
  }

  function isBlankCanvas(canvas, options = {}) {
    const tolerance = options.whiteTolerance ?? 250;
    const ratioThreshold = options.nonWhiteRatioThreshold ?? 0.02;
    const sampleStep = options.sampleStep ?? 8;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    let imageData;
    try {
      imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.warn("[LabelPrinter] Canvas blank check failed; keeping label.", error);
      return false;
    }

    const data = imageData.data;
    let sampled = 0;
    let nonWhite = 0;

    for (let index = 0; index < data.length; index += sampleStep * 4) {
      sampled += 1;
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];
      const alpha = data[index + 3];

      if (alpha > 0 && !(red >= tolerance && green >= tolerance && blue >= tolerance)) {
        nonWhite += 1;
      }
    }

    return nonWhite / Math.max(1, sampled) < ratioThreshold;
  }

  function splitImageIntoQuadrants(img, settings, className = "lp-label-canvas") {
    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;
    const halfWidth = naturalWidth / 2;
    const halfHeight = naturalHeight / 2;
    const slices = [
      [0, 0],
      [halfWidth, 0],
      [0, halfHeight],
      [halfWidth, halfHeight]
    ];

    return slices
      .map(([x, y]) => drawImageSlice(img, x, y, halfWidth, halfHeight, className))
      .filter((canvas) => !settings.skipBlankLabels || !isBlankCanvas(canvas));
  }

  function wrapAsPrintPage(element, className = "lp-print-page") {
    const wrapper = document.createElement("section");
    wrapper.className = className;
    wrapper.appendChild(element);
    return wrapper;
  }

  async function autoPrint(settings) {
    if (!settings.autoPrint || settings.debugMode) return;
    await sleep(Number(settings.printDelayMs) || DEFAULT_SETTINGS.printDelayMs);
    window.print();
  }

  window.LabelPrinterEngine = {
    DEFAULT_SETTINGS,
    autoPrint,
    getSettings,
    log,
    markOnce,
    replaceBodyWith,
    sleep,
    splitImageIntoQuadrants,
    waitForImages,
    wrapAsPrintPage
  };
})();
