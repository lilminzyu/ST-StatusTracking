<template>

  <div 
    v-if="settings.panel_enabled"
    class="status-panel"
    :class="[
      settings.panel_position,
      { collapsed: settings.panel_collapsed }
    ]"
  >
    <!-- 摺疊按鈕 -->
    <div 
      class="collapse-toggle" 
      :class="settings.panel_position"
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
            <!-- 目前先用假資料 -->
            <span class="value-text">等待數據...</span>
            </div>
        </div>

        <!-- 如果沒有啟用的欄位，顯示提示 -->
        <div v-if="enabledFields.length === 0" class="empty-hint">
          {{ t`尚未設定欄位，請點擊下方「欄位設定」按鈕` }}
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
import { Popup, POPUP_RESULT, POPUP_TYPE } from '@sillytavern/scripts/popup';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

const { settings } = storeToRefs(useSettingsStore());

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

// 只顯示啟用的欄位，並按 order 排序
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
/* 主面板容器 */
.status-panel {
  position: fixed;
  /* top: var(--topBarBlockSize, 0); */
  height:100%;
  bottom: 0;
  background: var(--black70a);
  backdrop-filter: blur(calc(var(--blurStrength) * 10));
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  flex-direction: column;
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
  width: 30px !important;
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
  width: 30px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--SmartThemeBorderColor);
  transition: background 0.2s, opacity 0.2s;
  z-index: 10;
  color: var(--SmartThemeBodyColor);
}

/* 右側面板的按鈕 - 貼左邊 */
.collapse-toggle.right {
  left: 0;
  border-left: none;
  border-radius: 0 8px 8px 0;
}

/* 左側面板的按鈕 - 貼右邊 */
.collapse-toggle.left {
  right: 0;
  border-right: none;
  border-radius: 8px 0 0 8px;
}

.collapse-toggle:hover {
  background: var(--SmartThemeBlurTintColor);
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
  flex: 1;
  overflow-y: auto;
}

.status-item {
  margin-bottom: 15px;
  padding: 10px;
  background: var(--black50a);
  border-radius: 5px;
}

.status-name {
  display: block;
  margin-bottom: 5px;
  color: var(--SmartThemeBodyColor);
  font-weight: bold;
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
</style>