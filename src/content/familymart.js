(() => {
  const engine = window.LabelPrinterEngine;
  if (!engine || !engine.markOnce("familymart")) return;

  const url = new URL(window.location.href);

  function isSubmitPage() {
    return url.hostname === "mybid.ruten.com.tw" && url.pathname === "/deliver/sel_cvs_store.php";
  }

  function isFamiPortIndexPage() {
    return /\/index\.aspx$/i.test(url.pathname);
  }

  function isImagePrintPage() {
    return (
      /OrderPrint\.aspx$/i.test(url.pathname) ||
      /OrdersPrint\.aspx$/i.test(url.pathname) ||
      /PrintOrder\.aspx$/i.test(url.pathname) ||
      /shipping_label/i.test(url.pathname) ||
      /\/Member\/Order\/PrintFamiC2CLabel$/i.test(url.pathname) ||
      /family_c2c_od_print_delegate\.php$/i.test(url.pathname) ||
      /famimart_shipping_order_preview\.php$/i.test(url.pathname) ||
      /iw_shipping_order_display\.php$/i.test(url.pathname)
    );
  }

  function candidateImages() {
    return [...document.images].filter((img) => img.currentSrc || img.src);
  }

  function usableImages() {
    return [...document.images].filter((img) => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      return width >= 300 && height >= 300 && (img.currentSrc || img.src);
    });
  }

  function applyFamilyMartScale(settings) {
    const scalePercent = Number(settings.familymartScalePercent) || 90;
    const boundedScale = Math.min(100, Math.max(50, scalePercent));
    document.documentElement.style.setProperty("--lp-familymart-scale", String(boundedScale / 100));
  }

  async function clickSubmitButton(settings) {
    if (settings.debugMode) {
      engine.log(settings, "Debug mode enabled; skipping FamilyMart submit click.");
      return;
    }

    const button = document.getElementById("doSubmit");
    if (!button) {
      engine.log(settings, "FamilyMart submit button not found.");
      return;
    }
    engine.log(settings, "Clicking FamilyMart submit button.");
    await engine.sleep(Number(settings.printDelayMs) || 800);
    button.click();
  }

  async function optimizeFamiPortPage(settings) {
    applyFamilyMartScale(settings);
    document.documentElement.classList.add("lp-familymart-famiport");

    const iframe = document.getElementById("iTaget");
    if (iframe) {
      iframe.addEventListener("load", () => {
        try {
          const innerDocument = iframe.contentDocument || iframe.contentWindow.document;
          const panel = innerDocument.getElementById("Panel1");
          if (panel) panel.style.display = "none";
        } catch (error) {
          engine.log(settings, "Unable to access FamiPort iframe.", error);
        }
      });
    }

    await engine.autoPrint(settings);
  }

  async function printImageLabels(settings) {
    applyFamilyMartScale(settings);

    await engine.waitForImages(candidateImages());
    await engine.sleep(100);
    const images = usableImages();

    if (!images.length) {
      engine.log(settings, "No FamilyMart label images found.");
      return;
    }

    const labels = [];
    for (const image of images) {
      labels.push(...engine.splitImageIntoQuadrants(image, settings, "lp-familymart-label"));
    }

    if (!labels.length) {
      engine.log(settings, "All FamilyMart labels were detected as blank.");
      return;
    }

    engine.replaceBodyWith(labels.map((label) => engine.wrapAsPrintPage(label)), "lp-print-root");
    await engine.autoPrint(settings);
  }

  async function run() {
    const settings = await engine.getSettings();
    if (!settings.enabled) return "外掛已停用";
    if (!settings.familymartEnabled) return "全家功能已停用";

    if (isSubmitPage()) {
      await clickSubmitButton(settings);
      return "已處理全家送出頁";
    }

    if (isFamiPortIndexPage()) {
      await optimizeFamiPortPage(settings);
      return "已處理 FamiPort 頁面";
    }

    if (isImagePrintPage()) {
      await printImageLabels(settings);
      return "已處理全家標籤頁";
    }

    return "目前網址不是支援的全家頁面";
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action !== "labelPrinterRun") return false;

    run()
      .then((messageText) => sendResponse({ ok: true, message: messageText }))
      .catch((error) => {
        console.error("[LabelPrinter] FamilyMart failed.", error);
        sendResponse({ ok: false, message: "全家功能執行失敗" });
      });

    return true;
  });
})();
