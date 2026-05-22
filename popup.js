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

const fields = [
  "enabled",
  "autoPrint",
  "skipBlankLabels",
  "debugMode",
  "printDelayMs",
  "familymartScalePercent",
  "familymartEnabled",
  "sevenElevenEnabled"
];

const $ = (id) => document.getElementById(id);

async function getSettings() {
  return chrome.storage.sync.get(DEFAULT_SETTINGS);
}

async function saveField(id) {
  const element = $(id);
  const value = element.type === "checkbox" ? element.checked : Number(element.value);
  await chrome.storage.sync.set({ [id]: value });
  updateStatus("設定已儲存");
}

function updateStatus(text) {
  $("statusText").textContent = text;
}

async function render() {
  const settings = await getSettings();
  for (const id of fields) {
    const element = $(id);
    if (element.type === "checkbox") {
      element.checked = Boolean(settings[id]);
    } else {
      element.value = String(settings[id]);
    }
  }
  updateStatus(settings.enabled ? "外掛已啟用" : "外掛已停用");
}

for (const id of fields) {
  $(id).addEventListener("change", () => saveField(id));
}

$("reset").addEventListener("click", async () => {
  await chrome.storage.sync.set(DEFAULT_SETTINGS);
  await render();
  updateStatus("已重設預設值");
});

$("runCurrentPage").addEventListener("click", async () => {
  updateStatus("正在啟動目前頁面");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      updateStatus("找不到目前分頁");
      return;
    }

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "labelPrinterRun"
    });

    updateStatus(response?.message || "已送出啟動指令");
  } catch (error) {
    updateStatus("此頁面不支援或需重新整理");
    console.warn("[LabelPrinter] Failed to run current page.", error);
  }
});

render();
