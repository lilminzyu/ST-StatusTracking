import '@/global.css';
import { initPanel } from '@/panel';
import { initStatusPanel } from '@/statusPanel';
import { initMessageListener } from '@/messageParser';
import { initPromptInjection, enablePromptInjection, disablePromptInjection } from '@/promptGenerator';
import { useSettingsStore } from '@/store/settings';
import { useStatusDataStore } from '@/store/statusData';

$(() => {
  initPanel();
  initStatusPanel();

  // 取得 store 實例
  const settingsStore = useSettingsStore();
  const statusDataStore = useStatusDataStore();

  // 初始化 Prompt 注入系統
  initPromptInjection();

  // 初始化訊息監聽器
  initMessageListener(
    (data) => {
      // 更新 statusData store
      statusDataStore.data.date = data.date;
      statusDataStore.data.location = data.location;
      statusDataStore.data.weather = data.weather;
      statusDataStore.data.news = data.news;
      statusDataStore.data.customFields = data.customFields;
    },
    () => {
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
        settingsStore.settings.custom_prompt
      );
    } else {
      disablePromptInjection();
    }
  }, { immediate: true }); // immediate: true 表示立即執行一次

  // 監聽 fields, language, custom_prompt 變化，重新注入 prompt
  watch(
    () => [
      settingsStore.settings.fields,
      settingsStore.settings.language,
      settingsStore.settings.custom_prompt,
    ] as const,
    ([fields, language, customPrompt]) => {
      if (settingsStore.settings.panel_enabled) {
        enablePromptInjection(fields, language, customPrompt);
      }
    },
    { deep: true } // deep: true 表示深度監聽
  );
});
