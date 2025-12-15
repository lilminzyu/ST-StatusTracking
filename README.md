# ST-StatusTracking ⚠️ 測試版

> ⚠️ **警告：此專案目前為測試版本 (v0.3.0-beta)，功能尚未完全穩定，可能會有 bug 或功能變更。**

一個為 SillyTavern 設計的擴充功能，能讓 AI 在回覆時自動更新並顯示狀態欄，包含時間、地點、天氣、新聞等固定欄位，以及可自訂的動態欄位（如好感度、內心話等）。

![版本](https://img.shields.io/badge/version-0.3.0--beta-orange)
![SillyTavern](https://img.shields.io/badge/SillyTavern-compatible-blue)
![授權](https://img.shields.io/badge/license-Aladdin-green)

## 功能特色

### 核心功能
- **智能狀態追蹤**：自動從 AI 回覆中解析並顯示狀態資訊
- **動態狀態面板**：可隱藏的側邊欄顯示
- **代碼塊自動隱藏**：AI 回覆中的 ```myst 代碼塊會自動隱藏，不影響對話閱讀
- **自訂欄位**：用戶可自訂需要的欄位
- **固定欄位可自訂**：擴充內置的固定欄位也可開關、自行編輯提示詞

### 固定欄位
- **時間**：顯示當前劇情時間
- **地點**：階層式地點顯示
- **天氣**：當前劇情天氣或環境溫度
- **新聞報導**：社會事件標題與內文

### 自訂欄位
- **文字欄位**：適合顯示內心話、當前衣著狀態、動作等文字資訊
- **數字欄位**：適合顯示好感度、體力值等數值，支援：
  - 漸層進度條視覺化
  - 自訂進度條顏色（低值/高值）
- **完全自訂**：欄位名稱、描述、順序、啟用/停用都可自由設定
- **拖曳排序**：直覺的拖曳介面調整欄位順序

### 多語言支援
- **三語支援**：繁體中文 / 簡體中文 / English
- **自訂 Prompt**：每個固定欄位的 AI 提示詞都可以自訂並恢復預設

### 進階設定
- **面板位置選擇**：左側或右側
- **Debug 模式**：方便開發者查看詳細 log
- **設定同步**：所有設定自動儲存到 SillyTavern 伺服器，換裝置也能同步
- **分頁設定介面**：一般設定 / Prompt 設定 / 固定欄位 / 自訂欄位

## 安裝方式

1. 開啟 SillyTavern
2. 點擊右上角的「擴充」圖示
3. 點擊「安裝擴充」
4. 在 URL 欄位輸入：
   ```
   https://github.com/lilminzyu/ST-StatusTracking
   ```
5. 點擊「安裝」
6. 重新載入 SillyTavern 頁面

## 使用方法

### 基本設定

1. **啟用擴充**：在 SillyTavern 擴充列表中啟用「Status Tracking」
2. **啟用狀態面板**：點擊擴充設定中的「啟用狀態面板」開關
3. **設定欄位**：
   - 點擊「欄位設定」按鈕
   - 在「固定欄位設定」標籤中選擇要啟用的固定欄位
   - 在「自訂欄位設定」標籤中新增/編輯自訂欄位

### AI Prompt 設定

**自訂 Prompt**：
- 點擊「Prompt 設定」標籤
- 點擊「編輯固定欄位 Prompt」
- 修改每個欄位的說明文字
- 點擊「恢復預設」可還原為預設值

### 欄位設定範例

#### 固定欄位範例
```myst
time: 2024年12月15日．星期日．14時30分
place: 咖啡廳．二樓靠窗座位
weather: 陰天微涼．18°C．細雨
news:
  title: 城市中心發現神秘貓咪咖啡廳，網友直呼：太療癒了！
  content: 位於市中心的一家新開幕咖啡廳，因店內有超過20隻可愛貓咪而爆紅。許多網友在論壇上分享體驗，表示這是他們見過最放鬆的下午茶環境。店長表示所有貓咪都是領養的流浪貓。
```

#### 自訂欄位範例

**數字欄位（好感度）**：
- 欄位名稱：`好感度`
- 給AI的欄位說明：`<char>對<user>當前的好感度數值, 0-100, 格式為 數字%`
- 類型：數字

AI 回應範例：
```
好感度: 75%
```
顯示效果：會顯示一個75%進度的漸層進度條

**文字欄位（內心話）**：
- 欄位名稱：`內心話`
- 給AI的欄位說明：`<char>當前'正文'劇情內心第一人稱想法, 100字內`
- 類型：文字

AI 回應範例：
```yaml
內心話: 他今天看起來心情不錯，也許這是個好機會...
```

### 進階功能

**代碼塊自動隱藏**：
- AI 回覆中的 ```myst 代碼塊會自動隱藏
- 適用於所有場景：新訊息、swipe、編輯、聊天切換等
- 不影響對話閱讀體驗

## 介面說明

### 狀態面板
- **位置**：可在設定中選擇左側或右側

### 設定面板
- **一般設定**：面板位置、語言、進度條顏色、Debug 模式
- **Prompt 設定**：固定欄位的 AI 提示詞自訂
- **固定欄位設定**：啟用/停用時間、地點、天氣、新聞
- **自訂欄位設定**：新增、編輯、刪除、排序自訂欄位

## 開發者資訊

### 技術棧
- **Framework**: Vue 3 (Composition API)
- **State Management**: Pinia
- **Schema Validation**: Zod
- **Build Tool**: Vite
- **Styling**: CSS + TailwindCSS (可選)
- **Language**: TypeScript

### 專案結構

```
ST-StatusTracking/
├── src/
│   ├── components/          # Vue 元件
│   │   ├── FieldList.vue   # 欄位列表
│   │   └── StatusDisplay.vue # 狀態顯示
│   ├── store/              # Pinia stores
│   │   ├── settings.ts     # 設定管理
│   │   ├── statusData.ts   # 狀態資料
│   │   └── i18n.ts         # 國際化
│   ├── type/               # TypeScript 類型定義
│   ├── utils/              # 工具函數
│   ├── index.ts            # 主入口
│   ├── panel.ts            # 設定面板
│   ├── statusPanel.ts      # 狀態面板
│   ├── messageParser.ts    # 訊息解析
│   ├── messageRenderer.ts  # 訊息渲染
│   └── promptGenerator.ts  # Prompt 生成
├── i18n/                   # 翻譯檔案
│   ├── en.json
│   ├── zh-TW.json
│   └── zh-CN.json
├── dist/                   # 打包輸出
├── manifest.json           # 擴充清單
└── package.json
```

### CI/CD

專案使用 GitHub Actions 自動化流程：

- **自動打包**：每次推送到 `dev` 分支都會自動打包
- **自動部署**：
  - `testing` 分支：每次推送都會更新（用於測試）
  - `main` 分支：commit message 包含 `[release]` 時才會更新（正式版）
- **自動版本號**：
  - `[release major]`: 1.0.0 → 2.0.0
  - `[release minor]`: 1.0.0 → 1.1.0
  - `[release]` 或 `[release patch]`: 1.0.0 → 1.0.1

## 🐛 已知問題

⚠️ **測試版警告**：
- 部分邊界情況可能尚未完全測試
- UI 在某些特殊情況下可能有顯示問題
- 尙不支援手機版

如果遇到問題，請在 [GitHub Issues](https://github.com/lilminzyu/ST-StatusTracking/issues) 回報。

## 更新日誌

### v0.3.0-beta (測試版)
- ✨ 新增簡體中文語言支援
- ✨ 新增歷史狀態記憶功能（向上遍歷找到最近的有效狀態）
- ✨ 新增 ```myst 代碼塊自動隱藏功能
- ✨ 新增固定欄位 Prompt 自訂功能
- 🐛 修復訊息刪除後狀態欄不更新的問題
- 🐛 修復擴充更新時覆蓋用戶自訂 Prompt 的問題
- 🐛 修復簡體中文 UI 翻譯無法載入的問題
- 🔧 優化 GitHub Actions 打包流程

### v0.2.0
- ✨ 新增多語言支援（繁中/簡中/英文）
- ✨ 新增固定欄位啟用/停用功能
- ✨ 新增階層式新聞區塊
- 🎨 優化設定介面為分頁結構

### v0.1.0
- 🎉 初始版本發布
- ✨ 基本狀態追蹤功能
- ✨ 固定欄位與自訂欄位支援

## 貢獻

歡迎提交 Issue 或 Pull Request！

1. Fork 此專案
2. 建立你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的變更 (`git commit -m 'feat: 新增某個很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟一個 Pull Request

## 授權

本專案採用 [Aladdin Free Public License (AFPL)](LICENSE) 授權條款。

- ⚠️ 商業用途受到限制（詳見 LICENSE 文件）
- 📝 使用時需註明原作者並包含授權聲明

## 作者

**mingyu**

- GitHub: [@lilminzyu](https://github.com/lilminzyu)
- 專案首頁: [ST-StatusTracking](https://github.com/lilminzyu/ST-StatusTracking)

## 致謝

- 感謝 [SillyTavern](https://github.com/SillyTavern/SillyTavern) 團隊提供優秀的對話平台
- 專案模板來自 [tavern_extension_template](https://github.com/StageDog/tavern_extension_template)

---

如果這個專案對你有幫助，請給個星星支持一下！⭐⭐⭐ 
