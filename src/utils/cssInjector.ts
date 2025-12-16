/**
 * CSS 動態注入工具
 * 用於在運行時注入和管理用戶自訂的 CSS 樣式
 */

import { logger } from './logger';

const CUSTOM_CSS_ID = 'status-tracking-custom-css';

/**
 * 應用自訂 CSS
 * @param css 用戶自訂的 CSS 字串
 */
export function applyCustomCSS(css: string): void {
  try {
    logger.log('[cssInjector] 開始應用自訂 CSS');

    // 移除舊的自訂樣式
    const oldStyle = document.getElementById(CUSTOM_CSS_ID);
    if (oldStyle) {
      oldStyle.remove();
      logger.log('[cssInjector] 已移除舊的自訂樣式');
    }

    // 如果 CSS 為空，則不注入
    if (!css || !css.trim()) {
      logger.log('[cssInjector] CSS 為空，不進行注入');
      return;
    }

    // 注入新的自訂樣式
    const styleElement = document.createElement('style');
    styleElement.id = CUSTOM_CSS_ID;
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    logger.log('[cssInjector] 自訂 CSS 已成功注入');
  } catch (error) {
    logger.error('[cssInjector] 注入 CSS 時發生錯誤:', error);
  }
}

/**
 * 移除自訂 CSS
 */
export function removeCustomCSS(): void {
  const styleElement = document.getElementById(CUSTOM_CSS_ID);
  if (styleElement) {
    styleElement.remove();
    logger.log('[cssInjector] 自訂 CSS 已移除');
  }
}

/**
 * 檢查是否已注入自訂 CSS
 */
export function hasCustomCSS(): boolean {
  return !!document.getElementById(CUSTOM_CSS_ID);
}
