import '@/global.css';
import { initMessageListener } from '@/messageParser';
import { initMessageRenderer } from '@/messageRenderer';
import { initPanel } from '@/panel';
import { disablePromptInjection, enablePromptInjection, initPromptInjection } from '@/promptGenerator';
import { initStatusPanel } from '@/statusPanel';
import { useSettingsStore } from '@/store/settings';
import { useStatusDataStore } from '@/store/statusData';
import { applyCustomCSS } from '@/utils/cssInjector';
import { logger } from '@/utils/logger';

$(() => {
  logger.log('[index] 擴充開始初始化');

  initPanel();
  initStatusPanel();
  initMessageRenderer();

  // 取得 store 實例
  const settingsStore = useSettingsStore();
  const statusDataStore = useStatusDataStore();

  // 初始化 Prompt 注入系統
  initPromptInjection();

  // 應用用戶自訂 CSS（如果有）
  applyCustomCSS(settingsStore.settings.custom_css);

  logger.log('[index] 擴充初始化完成');

  // 初始化訊息監聽器
  initMessageListener(
    (data) => {
      logger.log('[index] 收到狀態更新');
      // 更新 statusData store
      statusDataStore.data.date = data.date;
      statusDataStore.data.location = data.location;
      statusDataStore.data.weather = data.weather;
      statusDataStore.data.news = data.news;
      statusDataStore.data.customFields = data.customFields;
    },
    () => {
      logger.log('[index] 清空狀態資料');
      // 清空 statusData store
      statusDataStore.clearData();
    },
    () => settingsStore.settings.fields // 提供取得欄位設定的函數
  );

  // 監聽 panel_enabled 變化，決定是否注入 prompt
  watch(() => settingsStore.settings.panel_enabled, (enabled) => {
    if (enabled) {
      enablePromptInjection(
        settingsStore.settings.fields,
        settingsStore.settings.language,
        settingsStore.settings.fixed_fields_enabled,
        settingsStore.settings.custom_prompt
      );
    } else {
      disablePromptInjection();
    }
  }, { immediate: true }); // immediate: true 表示立即執行一次

  // 監聽 fields, language, fixed_fields_enabled, custom_prompt 變化，重新注入 prompt
  watch(
    () => [
      settingsStore.settings.fields,
      settingsStore.settings.language,
      settingsStore.settings.fixed_fields_enabled,
      settingsStore.settings.custom_prompt,
    ] as const,
    ([fields, language, fixedFieldsEnabled, customPrompt]) => {
      if (settingsStore.settings.panel_enabled) {
        enablePromptInjection(fields, language, fixedFieldsEnabled, customPrompt);
      }
    },
    { deep: true } // deep: true 表示深度監聽
  );

  // 監聽 custom_css 變化，動態應用 CSS
  watch(
    () => settingsStore.settings.custom_css,
    (newCSS) => {
      applyCustomCSS(newCSS);
      logger.log('[index] 自訂 CSS 已更新');
    }
  );
});
