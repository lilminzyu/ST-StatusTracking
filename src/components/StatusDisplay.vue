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
          <div v-if="settings.fixed_fields_enabled.time">
            <span class="info-icon">📅</span>
            <span class="info-text">{{ statusData.data.date }}</span>
          </div>
          <div v-if="settings.fixed_fields_enabled.place">
            <span class="info-icon">📍</span>
            <span class="info-text">{{ statusData.data.location }}</span>
          </div>
          <div v-if="settings.fixed_fields_enabled.weather">
            <span class="info-icon">🌤️</span>
            <span class="info-text">{{ statusData.data.weather }}</span>
          </div>
        </div>

        <!-- 新聞區塊 -->
        <div v-if="settings.fixed_fields_enabled.news" class="news-section">
          <div class="news-section2">
            <div class="news-header">【{{t`新聞報導`}}】</div>
            <div class="news-no-header">
              <div class="news-divider"></div>
              <div class="news-title">{{ statusData.data.news.title }}</div>
              <div class="news-content">{{ statusData.data.news.content }}</div>
            </div>
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

            <!-- 數字類型：顯示進度條 -->
            <div v-if="field.type === 'number'" class="status-value">
              <div
                class="progress-bar-container"
                :style="{
                  '--progress-low-color': settings.progress_color_low,
                  '--progress-high-color': settings.progress_color_high
                }"
              >
                <div
                  class="progress-bar-fill"
                  :style="{ width: getProgressPercentage(field.id) + '%' }"
                ></div>
                <span class="progress-text">{{ statusData.data.customFields[field.id] ?? '—' }}</span>
              </div>
            </div>

            <!-- 文字類型：純文字顯示 -->
            <div v-else class="status-value">
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
import PanelSettings from '@/components/PanelSettings.vue';
import { useI18nStore } from '@/store/i18n';
import { useSettingsStore } from '@/store/settings';
import { useStatusDataStore } from '@/store/statusData';
import { Popup, POPUP_RESULT, POPUP_TYPE } from '@sillytavern/scripts/popup';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

const { settings } = storeToRefs(useSettingsStore());
const statusData = useStatusDataStore();
const { t } = useI18nStore();

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

// 計算進度條百分比（假設數字範圍是 0-100）
function getProgressPercentage(fieldId: string): number {
  const value = statusData.data.customFields[fieldId];

  if (value === undefined || value === null) return 0;

  // 轉換為數字
  const numValue = typeof value === 'number' ? value : Number(value);

  if (isNaN(numValue)) return 0;

  // 限制在 0-100 範圍內
  return Math.max(0, Math.min(100, numValue));
}

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
    initialSettings: settings.value, // 傳入完整設定
    initialFields: settings.value.fields,  // 傳入當前欄位數據
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
    const data = instance.getData();
    settings.value.fields = data.fields;
    settings.value.fixed_fields_enabled = data.fixed_fields_enabled;
    settings.value.custom_prompt = data.custom_prompt;
  }

  // 清理
  fieldApp.unmount();
}

async function openPanelSettings() {
  const container = document.createElement('div');

  const settingsApp = createApp(PanelSettings, {
    initialSettings: settings.value,
  });

  const pinia = createPinia();
  settingsApp.use(pinia);

  const i18n = {
    install: (app: any) => {
      app.config.globalProperties.t = t;
    },
  };
  settingsApp.use(i18n);

  const instance = settingsApp.mount(container) as any;

  const popup = new Popup(container, POPUP_TYPE.TEXT, '', {
    wide: true,
    okButton: true,
    cancelButton: true,
  });

  const result = await popup.show();
  if (result === POPUP_RESULT.AFFIRMATIVE) {
    const updated = instance.getData();
    console.log('[StatusDisplay] PanelSettings returned data:', updated);
    console.log('[StatusDisplay] custom_prompt from getData:', updated.custom_prompt);

    settings.value.panel_position = updated.panel_position;
    settings.value.language = updated.language;
    settings.value.progress_color_low = updated.progress_color_low;
    settings.value.progress_color_high = updated.progress_color_high;
    settings.value.custom_prompt = updated.custom_prompt;

    console.log('[StatusDisplay] settings.value after update:', settings.value);
    console.log('[StatusDisplay] settings.value.custom_prompt:', settings.value.custom_prompt);
  }

  settingsApp.unmount();
}
</script>