<template>

  <div 
    v-if="settings.panel_enabled"
    class="status-panel drawer-content"
    :class="[
      settings.panel_position,
      { 
      collapsed: settings.panel_collapsed,
      fillLeft: settings.panel_position === 'left', // 當 position 是 'left' 時添加 fillLeft
      fillRight: settings.panel_position === 'right', // 當 position 是 'right' 時添加 fillRight
      }
    ]"
  >
    <!-- 摺疊按鈕 -->
    <div 
      class="collapse-toggle" 
      :class="[
        settings.panel_position,
        { collapsed: settings.panel_collapsed }
      ]"
      @click="toggleCollapse"
    >
      <i 
        class="fa-solid" 
        :class="getCollapseIcon"
      ></i>
    </div>

    <!-- 面板內容 -->
    <div v-show="!settings.panel_collapsed" class="panel-content">
      
      <!-- 標題 -->
      <div class="panel-header">
        <h3>{{ t`狀態追蹤` }}</h3>
      </div>

      <!-- 固定資訊區 -->
      <div class="fixed-info-section">
        <div class="info-item">
          <div>
            <span class="info-icon">📅</span>
            <span class="info-text">{{ statusData.data.date }}</span>
          </div>
          <div>
            <span class="info-icon">📍</span>
            <span class="info-text">{{ statusData.data.location }}</span>
          </div>
          <div>
            <span class="info-icon">🌤️</span>
            <span class="info-text">{{ statusData.data.weather }}</span>
          </div>
        </div>
        
        <!-- 新聞區塊 -->
        <div class="news-section">
          <div class="news-header">【世界的另一處...】</div>
          <div class="news-no-header">
            <div class="news-divider"></div>
            <div class="news-title">{{ statusData.data.news.title }}</div>
            <div class="news-content">{{ statusData.data.news.content }}</div>
          </div>
        </div>
      </div>

      <!-- 用戶自訂欄位區 -->
      <div class="custom-fields-section">
        <!-- 狀態顯示區 -->
        <div class="status-list">
          <!-- 動態顯示用戶設定的欄位 -->
          <div 
            v-for="field in enabledFields" 
            :key="field.id"
            class="status-item"
          >
            <span class="status-name">{{ field.name }}</span>
              <div class="status-value">
              <span class="value-text">{{ statusData.data.customFields[field.id] || '—' }}</span>
              </div>
          </div>

          <!-- 如果沒有啟用的欄位，顯示提示 -->
          <div v-if="enabledFields.length === 0" class="empty-hint">
            {{ t`尚未設定欄位，請點擊下方「欄位設定」按鈕` }}
          </div>
        </div>
      </div>

      <!-- 按鈕區 -->
      <div class="panel-actions">
        <button class="menu_button" @click="openFieldSettings">
          <i class="fa-solid fa-list"></i> {{ t`欄位設定` }}
        </button>
        <button class="menu_button" @click="openPanelSettings">
          <i class="fa-solid fa-cog"></i> {{ t`擴充設定` }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import FieldList from '@/components/FieldList.vue';
import { useSettingsStore } from '@/store/settings';
import { useStatusDataStore } from '@/store/statusData';
import { Popup, POPUP_RESULT, POPUP_TYPE } from '@sillytavern/scripts/popup';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

const { settings } = storeToRefs(useSettingsStore());
const statusData = useStatusDataStore();

// 計算收合按鈕的 icon
const getCollapseIcon = computed(() => {
  const isRight = settings.value.panel_position === 'right';
  const isCollapsed = settings.value.panel_collapsed;
  
  // 右側面板：收合時顯示 "<"，展開時顯示 ">"
  // 左側面板：收合時顯示 ">"，展開時顯示 "<"
  if (isRight) {
    return isCollapsed ? 'fa-chevron-left' : 'fa-chevron-right';
  } else {
    return isCollapsed ? 'fa-chevron-right' : 'fa-chevron-left';
  }
});

// 只顯示啟用的欄位，並按 order 排序;p
const enabledFields = computed(() => {
  return settings.value.fields
    .filter(f => f.enabled)
    .sort((a, b) => a.order - b.order);
});

function toggleCollapse() {
  settings.value.panel_collapsed = !settings.value.panel_collapsed;
}

async function openFieldSettings() {

  // 創建標題
  const title = document.createElement('h3');
  title.textContent = t`欄位設定`;
  title.style.marginBottom = '15px';

  const container = document.createElement('div');
  container.appendChild(title);  // 加上標題

  // 創建內容容器
  const contentDiv = document.createElement('div');
  container.appendChild(contentDiv);
  
  const fieldApp = createApp(FieldList, {
    initialFields: settings.value.fields,  // 傳入當前數據
  });
  
  const pinia = createPinia();
  fieldApp.use(pinia);
  
  const i18n = {
    install: (app: any) => {
      app.config.globalProperties.t = t;
    },
  };
  fieldApp.use(i18n);
  
  // 掛載到內容容器並拿到組件實例
  const instance = fieldApp.mount(contentDiv) as any;
  
  // 顯示彈窗，帶確定/取消按鈕
  const popup = new Popup(container, POPUP_TYPE.TEXT, '', {
    wide: true,
    okButton: true,    // 顯示確定按鈕
    cancelButton: true, // 顯示取消按鈕
  });
  
  // 等待用戶操作
  const result = await popup.show();
  
  // 按確定，保存到主 store
  if (result === POPUP_RESULT.AFFIRMATIVE) {
    settings.value.fields = instance.getData();
  }
  
  // 清理
  fieldApp.unmount();
}

function openPanelSettings() {
  // TODO: 打開擴充設定彈窗
  console.log('打開擴充設定');
}
</script>

<style scoped>
@import url("https://fontsapi.zeoseven.com/40/main/result.css");

/* 主面板容器 */
.status-panel {
  /* position: fixed; */
  /* top: var(--topBarBlockSize, 0); */
  height:100%;
  /* bottom: 0;
  background: var(--SmartThemeBlurTintColor); */
  /* box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); */
  /* z-index: 1000; */
  display: flex;
  /* flex-direction: column; */
  transition: width 0.3s ease, left 0.3s ease, right 0.3s ease;
  overflow: visible;
}

/* 左側面板 */
.status-panel.left {
  left: 0;
  width: calc((100vw - var(--sheldWidth)) / 2);
}

/* 右側面板 */
.status-panel.right {
  right: 0;
  width: calc((100vw - var(--sheldWidth)) / 2);
}

/* 收合狀態 - 面板寬度變0 */
.status-panel.collapsed {
  width: 0px !important;
  min-width: 0px !important;
  background: transparent !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

/* 收合時隱藏面板內容的背景 */
.status-panel.collapsed .panel-content {
  display: none;
}

/* 摺疊按鈕 - 基本樣式 */
.collapse-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--SmartThemeBlurTintColor);
  /* box-shadow: 0 0 20px rgba(0, 0, 0, 0.5); */
  border: 1px solid var(--SmartThemeBorderColor);
  transition: background 0.2s, opacity 0.2s;
  z-index: 10;
  color: var(--SmartThemeBodyColor);
}

/* .collapse-toggle:hover {
  background: var(--SmartThemeBlurTintColor);
} */

/* 右側面板的按鈕 - 貼左邊 */
.collapse-toggle.right {
  left: -15px; /* <--- 讓按鈕向左凸出，距離面板左邊緣 -30px (按鈕寬度) */
  border-left: 1px solid var(--SmartThemeBorderColor);
  border-right: none;
  border-radius: 8px 0 0 8px;
}

/* 右側 + 收合 → 按鈕跑到外側並反轉圓角 */
.collapse-toggle.right.collapsed {
  left: auto;
  right: 100%;
  border-left: 1px solid var(--SmartThemeBorderColor);
  border-right: none;
  border-radius: 8px 0 0 8px;
}


/* 左側面板的按鈕 - 貼右邊 */
.collapse-toggle.left {
  right: -15;  /* <--- 讓按鈕向右凸出，距離面板右邊緣 -30px (按鈕寬度) */
  border-right: 1px solid var(--SmartThemeBorderColor);
  border-left: none;
  border-radius: 0 8px 8px 0;
}

/* 左側 + 收合 → 按鈕跑到外側並反轉圓角 */
.collapse-toggle.left.collapsed {
  right: auto;
  left: 100%;
  border-right: 1px solid var(--SmartThemeBorderColor);
  border-left: none;
  border-radius: 0 8px 8px 0;
}

/* 面板內容 */
.panel-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 15px;
  overflow-y: auto;
}

/* 標題 */
.panel-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--SmartThemeBorderColor);
}

.panel-header h3 {
  margin: 0;
  color: var(--SmartThemeBodyColor);
  font-size: 18px;
}

/* 狀態列表 */
.status-list {
  /* 讓列表區域有邊框和背景，形成一個整體區塊 */
  background: var(--SmartThemeBlurTintColor); /* 使用帶透明度的背景色 */
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 8px; /* 增加圓角 */
  padding: 0; /* 內部 padding 靠 status-item 控制 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  overflow: hidden; /* 確保邊框和圓角包裹住內部的項目 */
}

.custom-fields-section {
  flex: 1;
  overflow-y: auto;
  /* border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 5px; */
  padding: 0 10px;
  margin-top: 15px;
}

/* 狀態項目 - 實現分隔線和網格佈局 */
.status-item {
  margin-bottom: 0; /* 移除項目之間的外部間距 */
  padding: 10px 15px; /* 增加內邊距 */
  background: transparent; /* 背景透明，讓列表的背景色顯示出來 */
  border-radius: 0; /* 移除圓角 */
  
  /* 項目分隔線：只顯示底部邊框 */
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  
  /* 網格佈局：讓名稱和數值分兩列，自動對齊 */
  display: grid;
  grid-template-columns: 1fr auto; /* 左邊佔滿空間，右邊數值自動寬度 */
  align-items: center;
}

/* 移除最後一個 status-item 的底部分隔線 */
.status-list .status-item:last-child {
  border-bottom: none;
}

/* 狀態名稱 */
.status-name {
  margin-bottom: 0; /* 移除原有的下邊距 */
  font-weight: 600; /* 加粗 */
  font-size: 15px;
  color: var(--SmartThemeBodyColor);
  /* 新增：為名稱旁邊的省略號留空間 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-value {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 進度條 */
.progress-bar {
  flex: 1;
  height: 20px;
  background: var(--black30a);
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s ease;
}

.progress-text {
  min-width: 60px;
  text-align: right;
  color: var(--SmartThemeBodyColor);
  font-size: 14px;
}

/* 提示訊息 (如果沒有欄位) */
.empty-hint {
  padding: 20px;
  text-align: center;
  color: var(--SmartThemeQuoteColor);
  font-style: italic;
  /* 確保提示訊息也在帶邊框的容器內 */
  border-radius: 8px; 
}

/* 按鈕區 */
.panel-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid var(--SmartThemeBorderColor);
}

.panel-actions .menu_button {
  flex: 1;
  padding: 10px;
  text-align: center;
}

.value-text {
  color: var(--SmartThemeBodyColor);
}

.empty-hint {
  padding: 20px;
  text-align: center;
  color: var(--SmartThemeQuoteColor);
  font-style: italic;
}

/* 固定資訊區塊整體 */
.fixed-info-section {
  display: flex;
  flex-direction: column;
  gap: 15px; /* 資訊項目和新聞區之間的間距 */
  padding: 0 10px; /* 內邊距，使其與邊界有一點距離 */
}

/* 資訊項目 (日期、地點、天氣) */
.info-item {
  display: flex;
  flex-direction: column; /* <-- 讓內部三個 div 垂直堆疊 */
  gap: 10px;
  background: var(--SmartThemeBlurTintColor); /* 使用帶透明度的背景色 */
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 內部個別資訊行 (📅, 📍, 🌤️ 所在的外層 div) */
.info-item > div {
  display: grid; /* <-- 使用 Grid 佈局來控制對齊 */
  /* 定義三列：
     1. 圖標 (固定寬度，靠左)
     2. 文字 (佔滿剩餘寬度，用於置中)
     3. 保持右側平衡的空白列 (固定寬度，與圖標寬度相同) 
  */
  grid-template-columns: 20px 1fr 20px;
  align-items: center;
  gap: 5px;
  color: var(--SmartThemeBodyColor); /* 主文字顏色 */
  font-size: 14px;
}

.info-icon {
  grid-column: 1; /* <-- 放在第一列，實現靠左對齊 */
  font-size: 16px;
  text-align: left; /* 確保圖標文字靠左 */
}

.info-text {
  grid-column: 2; /* <-- 放在第二列，讓它佔滿空間 */
  text-align: center; /* <-- **重點：文字在這個大列中置中** */
  font-weight: 500;
}

/* --- 新聞區塊 (報紙風格) --- */
.news-section {
  /* 報紙背景：利用 custColor 和輕微陰影營造質感 */
  background: rgba(var(--SmartThemeQuoteColor), 0.1); /* 使用 custColor 的輕微透明度 */
  border: 2px solid var(--SmartThemeBorderColor);
  border-radius: 5px;
  padding: 15px;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
  background-image: url('https://i.pinimg.com/736x/7e/5b/16/7e5b16b9cfafe1905c4d39672698cd90.jpg');
  background-size: cover;
  background-position: center;
}

/* 新聞標頭 */
.news-header {
  color: var(--SmartThemeQuoteColor); /* 醒目的顏色 */
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 5px;
  letter-spacing: 1px;
  text-align: center;
}

/* 分隔線 (報紙上的橫線) */
.news-divider {
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    var(--SmartThemeBorderColor),
    var(--SmartThemeBorderColor) 4px,
    transparent 4px,
    transparent 6px
  );
  margin-bottom: 10px;
}

/* 新聞標題 */
.news-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--SmartThemeBodyColor);
  margin-bottom: 8px;
  text-transform: uppercase; /* 標題大寫增加報紙感 */
}

/* 新聞內容 */
.news-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--SmartThemeBodyColor);
  /* 模擬兩欄排版 (可選，取決於面板寬度) */
  /* column-count: 2; 
  column-gap: 20px; */
  text-align: justify;
}

.news-no-header {
  font-family: "Otsutome_font";
  font-weight: normal;
}

i.fa-solid {
margin-right: 5px;
}
</style>