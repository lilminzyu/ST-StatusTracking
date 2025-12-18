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

      <!-- 空狀態提示 -->
      <div v-if="!hasAnyStatus" class="no-status-hint">
        {{ t`還沒有狀態能追蹤哦(oﾟvﾟ)ノ 給AI發送一條消息叭！` }}
      </div>

      <!-- 有狀態時才顯示 -->
      <template v-else>
        <!-- 固定資訊區 -->
        <div v-if="hasFixedFields" class="fixed-info-section">
          <div class="info-item">
            <div v-if="settings.fixed_fields_enabled.time && statusData.data.date">
              <span class="info-icon">📅</span>
              <span class="info-text">{{ statusData.data.date }}</span>
            </div>
            <div v-if="settings.fixed_fields_enabled.place && statusData.data.location">
              <span class="info-icon">📍</span>
              <span class="info-text">{{ statusData.data.location }}</span>
            </div>
            <div v-if="settings.fixed_fields_enabled.weather && statusData.data.weather">
              <span class="info-icon">🌤️</span>
              <span class="info-text">{{ statusData.data.weather }}</span>
            </div>
          </div>

          <!-- 新鮮事區塊 -->
          <div v-if="settings.fixed_fields_enabled.news && hasNewsContent" class="news-section">
            <div class="news-section2">
              <div class="news-header">{{ statusData.data.news.type}}</div>
              <div class="news-no-header">
                <div class="news-divider"></div>
                <div class="news-title">{{ statusData.data.news.title }}</div>
                <div class="news-content">{{ statusData.data.news.content }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用戶自訂欄位區 -->
        <div v-if="hasCustomFields" class="custom-fields-section">
          <!-- 狀態顯示區 -->
          <div class="status-list">
            <!-- 動態顯示用戶設定的欄位 -->
            <div
              v-for="field in fieldsWithContent"
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
                  <span class="progress-text">{{ getDisplayText(field.id) }}</span>
                </div>
              </div>

              <!-- 文字類型：純文字顯示 -->
              <div v-else class="status-value">
                <span class="value-text">{{ statusData.data.customFields[field.id] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 備忘錄區 -->
        <div v-if="settings.fixed_fields_enabled?.notes && statusData.data.notes" class="notes-section">
          <div class="notes-content">
            <div class="notes-header">{{t`備忘錄`}}</div>
            <div class="news-divider"></div>
            <div class="notes-text">{{ statusData.data.notes }}</div>
          </div>
        </div>
      </template>

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
import { logger } from '@/utils/logger';
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

// 只顯示啟用的欄位，並按 order 排序
const enabledFields = computed(() => {
  return settings.value.fields
    .filter(f => f.enabled)
    .sort((a, b) => a.order - b.order);
});

// 只顯示有內容的欄位
const fieldsWithContent = computed(() => {
  return enabledFields.value.filter(field => {
    const value = statusData.data.customFields[field.id];
    // 檢查是否有值（排除 undefined, null, 空字串）
    if (value === undefined || value === null || value === '') return false;
    // 如果是 NumberFieldValue 物件，檢查 value 屬性
    if (typeof value === 'object' && 'value' in value) {
      return value.value !== undefined && value.value !== null;
    }
    return true;
  });
});

// 檢查是否有新聞內容
const hasNewsContent = computed(() => {
  return !!(statusData.data.news.type || statusData.data.news.title || statusData.data.news.content);
});

// 檢查是否有固定欄位內容
const hasFixedFields = computed(() => {
  const hasTime = settings.value.fixed_fields_enabled.time && statusData.data.date;
  const hasPlace = settings.value.fixed_fields_enabled.place && statusData.data.location;
  const hasWeather = settings.value.fixed_fields_enabled.weather && statusData.data.weather;
  const hasNews = settings.value.fixed_fields_enabled.news && hasNewsContent.value;

  return !!(hasTime || hasPlace || hasWeather || hasNews);
});

// 檢查是否有自訂欄位內容
const hasCustomFields = computed(() => {
  return fieldsWithContent.value.length > 0;
});

// 檢查是否有任何狀態內容
const hasAnyStatus = computed(() => {
  const hasNotes = settings.value.fixed_fields_enabled.notes && statusData.data.notes;
  return hasFixedFields.value || hasCustomFields.value || hasNotes;
});

// 計算進度條百分比（假設數字範圍是 0-100）
function getProgressPercentage(fieldId: string): number {
  const value = statusData.data.customFields[fieldId];

  if (value === undefined || value === null) return 0;

  // 如果是 NumberFieldValue 物件，使用 value 屬性
  let numValue: number;
  if (typeof value === 'object' && 'value' in value) {
    numValue = value.value;
  } else if (typeof value === 'number') {
    numValue = value;
  } else {
    numValue = Number(value);
  }

  if (isNaN(numValue)) return 0;

  // 限制在 0-100 範圍內
  return Math.max(0, Math.min(100, numValue));
}

// 取得顯示文字
function getDisplayText(fieldId: string): string {
  const value = statusData.data.customFields[fieldId];

  if (value === undefined || value === null) return '—';

  // 如果是 NumberFieldValue 物件，使用 display 屬性
  if (typeof value === 'object' && 'display' in value) {
    return value.display;
  }

  return String(value);
}

function toggleCollapse() {
  logger.log('[StatusDisplay] 使用者點擊收合按鈕');
  settings.value.panel_collapsed = !settings.value.panel_collapsed;
}

async function openFieldSettings() {
  logger.log('[StatusDisplay] 使用者點擊欄位設定按鈕');

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
    logger.log('[StatusDisplay] 使用者確認儲存欄位設定');
    const data = instance.getData();
    settings.value.fields = data.fields;
    settings.value.fixed_fields_enabled = data.fixed_fields_enabled;
    settings.value.custom_prompt = data.custom_prompt;
  } else {
    logger.log('[StatusDisplay] 使用者取消欄位設定');
  }

  // 清理
  fieldApp.unmount();
}

async function openPanelSettings() {
  logger.log('[StatusDisplay] 使用者點擊擴充設定按鈕');
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
    logger.log('[StatusDisplay] 使用者確認儲存擴充設定');
    const updated = instance.getData();

    settings.value.panel_position = updated.panel_position;
    settings.value.language = updated.language;
    settings.value.progress_color_low = updated.progress_color_low;
    settings.value.progress_color_high = updated.progress_color_high;
    settings.value.custom_prompt = updated.custom_prompt;
    settings.value.custom_css = updated.custom_css;
  } else {
    logger.log('[StatusDisplay] 使用者取消擴充設定');
  }

  settingsApp.unmount();
}
</script>