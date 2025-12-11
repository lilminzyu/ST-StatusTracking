import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSettingsStore } from './settings';
import enTranslations from '../../i18n/en.json';

// 繁體中文翻譯（所有鍵都返回自己）
const zhTWTranslations: Record<string, string> = {};
// 從 en.json 的鍵建立繁中字典
Object.keys(enTranslations).forEach(key => {
  zhTWTranslations[key] = key; // 繁中就是鍵本身
});

// 翻譯字典
const translations: Record<string, Record<string, string>> = {
  'zh-TW': zhTWTranslations,
  'en': enTranslations as Record<string, string>,
};

// 偵測 SillyTavern 全域語言
function detectSTLanguage(): 'zh-TW' | 'en' {
  // 嘗試從 window 取得 SillyTavern 的語言設定
  if (typeof window !== 'undefined' && (window as any).i18next?.language) {
    const lang = (window as any).i18next.language;
    // 繁中或簡中都視為中文
    if (lang.startsWith('zh')) {
      return 'zh-TW';
    }
    // 其他語言都用英文
    return 'en';
  }
  // 預設繁中
  return 'zh-TW';
}

export const useI18nStore = defineStore('i18n', () => {
  const settingsStore = useSettingsStore();

  // 當前語言（如果用戶沒有手動設定過，就跟隨 SillyTavern）
  const currentLanguage = computed(() => {
    const savedLang = settingsStore.settings.language;

    // 如果是預設值（zh-TW），檢查是否應該跟隨 ST 語言
    if (savedLang === 'zh-TW') {
      return detectSTLanguage();
    }

    return savedLang;
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
