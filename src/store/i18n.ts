import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSettingsStore } from './settings';
import enTranslations from '../../i18n/en.json';
import zhTWTranslations from '../../i18n/zh-TW.json';
import zhCNTranslations from '../../i18n/zh-CN.json';

// 翻譯字典
const translations: Record<string, Record<string, string>> = {
  'zh-TW': zhTWTranslations as Record<string, string>,
  'zh-CN': zhCNTranslations as Record<string, string>,
  'en': enTranslations as Record<string, string>,
};

export const useI18nStore = defineStore('i18n', () => {
  const settingsStore = useSettingsStore();

  // 當前語言（直接使用用戶設定的語言）
  const currentLanguage = computed(() => {
    return settingsStore.settings.language;
  });

  // 翻譯函數（支援樣板字符串語法）
  function t(key: string | TemplateStringsArray, ...values: any[]): string {
    // 處理樣板字符串
    let finalKey: string;
    if (typeof key === 'string') {
      finalKey = key;
    } else {
      // TemplateStringsArray 的情況
      finalKey = key[0];
    }

    const lang = currentLanguage.value;
    const dict = translations[lang];

    if (dict && dict[finalKey]) {
      return dict[finalKey];
    }

    // 如果找不到翻譯，返回原文
    return finalKey;
  }

  return {
    currentLanguage,
    t,
  };
});
