import { setting_field, Settings } from '@/type/settings';
import { validateInplace } from '@/util/zod';
import { saveSettingsDebounced } from '@sillytavern/script';
import { extension_settings } from '@sillytavern/scripts/extensions';
import { DEFAULT_PROMPT_ZH_TW } from '@/promptGenerator';

export const useSettingsStore = defineStore('settings', () => {
  const rawSettings = _.get(extension_settings, setting_field);

  // 只有在完全沒有設定資料時（第一次安裝），才套用預設欄位
  // 如果有設定資料但 fields 是空陣列，表示用戶故意清空，不要自動加回來
  const isFirstInstall = rawSettings === undefined;

  const loadedSettings = validateInplace(Settings, rawSettings);

  // 如果是第一次安裝且 custom_prompt 是 undefined，設定預設的 custom_prompt
  if (isFirstInstall && !loadedSettings.custom_prompt) {
    loadedSettings.custom_prompt = DEFAULT_PROMPT_ZH_TW;
  }

  const settings = ref(loadedSettings);

  watch(
    settings,
    new_settings => {
      _.set(extension_settings, setting_field, klona(new_settings)); // 用 klona 克隆对象从而去除 proxy 层
      saveSettingsDebounced();
    },
    { deep: true },
  );
  return {
    settings,
  };
});
