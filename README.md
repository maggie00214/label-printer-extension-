# Logistics Label Batch Printer

新的 Chrome MV3 擴充功能，用於整理並批次列印全家 FamilyMart 與 7-11 物流標籤。

## 功能

- 透過 popup 按鈕依目前網址手動啟動，不會進入網址後自動執行。
- 全家標籤圖片自動切成四格。
- 支援 PayNow 全家 C2C 標籤頁 `https://logistic.paynow.com.tw/Member/Order/PrintFamiC2CLabel*`。
- 可略過近乎空白的標籤。
- 全家 FamiPort 頁面套用 10cm x 14cm 列印版面。
- 7-11 C2C 頁面可自動點擊列印按鈕。
- 7-11 多筆頁面可重排 `.div_frame` 為獨立列印頁。
- popup 可控制啟用、自動列印、除錯模式、列印延遲。
- popup 可調整全家標籤縮放比例，預設 90%。

## 安裝

1. 開啟 Chrome。
2. 進入 `chrome://extensions/`。
3. 開啟右上角「開發人員模式」。
4. 點「載入未封裝項目」。
5. 選擇此資料夾：`label-printer-extension`。

## 使用建議

進入支援的物流列印頁後，點擴充功能圖示，再按「依目前網址啟動」。

第一次測試請先開啟「除錯模式」，確認頁面整理結果正常後再關閉除錯模式讓它自動列印。

## 限制

- Chrome 一般擴充功能無法完全靜默列印，仍會開啟瀏覽器列印視窗。
- 各平台若改版 DOM 或圖片尺寸，可能需要調整 selector 或列印 CSS。
- 若標籤圖片受到跨來源限制，canvas 空白檢查可能無法讀取像素；此時會保留該標籤避免誤刪。
