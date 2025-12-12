import { useSettingsStore } from '@/store/settings';

/**
 * 統一的 logger 工具
 * 只有在 debug_mode 開啟時才會輸出 log
 */

function shouldLog(): boolean {
  try {
    const settingsStore = useSettingsStore();
    return settingsStore.settings.debug_mode;
  } catch {
    // 如果 store 還沒初始化，預設不輸出
    return false;
  }
}

export const logger = {
  log: (...args: unknown[]) => {
    if (shouldLog()) {
      console.log('[myst]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (shouldLog()) {
      console.warn('[myst]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (shouldLog()) {
      console.error('[myst]', ...args);
    }
  },
};
