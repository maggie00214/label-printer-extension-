(() => {
  const engine = window.LabelPrinterEngine;
  if (!engine || !engine.markOnce("seven-eleven")) return;

  const url = new URL(window.location.href);

  function isC2cPage() {
    return /\/C2C\.aspx$/i.test(url.pathname);
  }

  function isSinglePrintPage() {
    return /\/PrintC2CPinCode\.aspx$/i.test(url.pathname);
  }

  function isMultiplePrintPage() {
    return /\/MultiplePrintC2CPinCode\.aspx$/i.test(url.pathname);
  }

  async function clickPrintButton(settings) {
    if (settings.debugMode) {
      engine.log(settings, "Debug mode enabled; skipping 7-11 PrintOK click.");
      return;
    }

    const button = document.getElementById("PrintOK");
    if (!button) {
      engine.log(settings, "7-11 PrintOK button not found.");
      return;
    }

    await engine.sleep(Number(settings.printDelayMs) || 800);
    button.click();
  }

  async function printMultipleFrames(settings) {
    const frames = [...document.querySelectorAll(".div_frame")];
    if (!frames.length) {
      engine.log(settings, "No 7-11 .div_frame labels found.");
      return;
    }

    const pages = frames.map((frame) => {
      const clone = frame.cloneNode(true);
      return engine.wrapAsPrintPage(clone, "lp-seven-page");
    });

    engine.replaceBodyWith(pages, "lp-print-root");
    await engine.autoPrint(settings);
  }

  async function run() {
    const settings = await engine.getSettings();
    if (!settings.enabled) return "外掛已停用";
    if (!settings.sevenElevenEnabled) return "7-11 功能已停用";

    if (isC2cPage()) {
      await clickPrintButton(settings);
      return "已處理 7-11 C2C 頁面";
    }

    if (isMultiplePrintPage()) {
      await printMultipleFrames(settings);
      return "已處理 7-11 多筆列印頁";
    }

    if (isSinglePrintPage()) {
      await engine.autoPrint(settings);
      return "已處理 7-11 單張列印頁";
    }

    return "目前網址不是支援的 7-11 頁面";
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action !== "labelPrinterRun") return false;

    run()
      .then((messageText) => sendResponse({ ok: true, message: messageText }))
      .catch((error) => {
        console.error("[LabelPrinter] 7-11 failed.", error);
        sendResponse({ ok: false, message: "7-11 功能執行失敗" });
      });

    return true;
  });
})();
