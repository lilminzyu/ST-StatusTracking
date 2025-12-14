import { eventSource, event_types } from '@sillytavern/script';
import { getContext } from '@sillytavern/scripts/extensions';
import { logger } from '@/utils/logger';

/**
 * 隱藏單個訊息中的 ```myst 代碼塊
 * @param messageElement 訊息元素
 */
function hideCodeBlockInMessage(messageElement: JQuery<HTMLElement>) {
  if (!messageElement.length) {
    return;
  }

  // 找到訊息文字區域
  const mesText = messageElement.find('.mes_text');

  if (!mesText.length) {
    return;
  }

  // 找到所有的 <pre> 元素（代碼塊容器）
  mesText.find('pre').each(function() {
    const preElement = $(this);
    const codeElement = preElement.find('code');

    if (!codeElement.length) {
      return;
    }

    // 取得代碼塊的原始 HTML（包含語言標記）
    const preHtml = preElement.html();
    const codeText = codeElement.text();

    // 檢查是否是 ```myst 代碼塊
    // 方法 1: 檢查 <code> 元素的 class（通常會有 language-myst）
    // 方法 2: 檢查代碼內容是否符合 YAML 格式且包含我們的欄位
    const isMystBlock =
      codeElement.hasClass('language-myst') ||
      preHtml.includes('language-myst') ||
      // 簡單的 YAML 格式檢測：多行且包含 key: value 格式
      (codeText.includes(':') && codeText.split('\n').length > 1);

    if (isMystBlock) {
      logger.log('[messageRenderer] 隱藏 myst 代碼塊');
      preElement.hide();
    }
  });
}

/**
 * 隱藏指定 ID 的訊息中的代碼塊
 * @param messageId 訊息 ID
 */
function hideCodeBlockById(messageId: number) {
  const messageElement = $(`#chat .mes[mesid="${messageId}"]`);
  hideCodeBlockInMessage(messageElement);
}

/**
 * 隱藏所有訊息中的 myst 代碼塊
 */
function hideAllCodeBlocks() {
  logger.log('[messageRenderer] 隱藏所有訊息中的 myst 代碼塊');

  // 找到所有 AI 訊息（非使用者訊息）
  $('#chat .mes').each(function() {
    const messageElement = $(this);

    // 檢查是否是 AI 訊息（沒有 user_mes class）
    if (!messageElement.hasClass('user_mes')) {
      hideCodeBlockInMessage(messageElement);
    }
  });
}

/**
 * 初始化訊息渲染器
 */
export function initMessageRenderer() {
  logger.log('[messageRenderer] 初始化訊息渲染器');

  // 監聽 AI 訊息渲染完成事件
  eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (messageId: number) => {
    logger.log('[messageRenderer] AI 訊息已渲染，檢查是否需要隱藏代碼塊');
    hideCodeBlockById(messageId);
  });

  // 監聽訊息 swipe 事件（切換不同的回覆）
  eventSource.on(event_types.MESSAGE_SWIPED, (messageId: number) => {
    logger.log('[messageRenderer] 訊息已 swipe，檢查是否需要隱藏代碼塊');
    // swipe 會重新渲染，所以需要重新隱藏
    setTimeout(() => hideCodeBlockById(messageId), 100);
  });

  // 監聽訊息編輯事件
  eventSource.on(event_types.MESSAGE_EDITED, (messageId: number) => {
    logger.log('[messageRenderer] 訊息已編輯，檢查是否需要隱藏代碼塊');
    // 編輯後可能會重新渲染，延遲一點執行
    setTimeout(() => hideCodeBlockById(messageId), 100);
  });

  // 監聽聊天切換事件（包含新建聊天、切換角色等）
  eventSource.on(event_types.CHAT_CHANGED, () => {
    logger.log('[messageRenderer] 聊天已切換，隱藏所有 myst 代碼塊');
    // 聊天切換後需要處理所有訊息
    setTimeout(() => hideAllCodeBlocks(), 100);
  });

  // 初始載入時處理一次所有訊息
  setTimeout(() => hideAllCodeBlocks(), 500);
}
