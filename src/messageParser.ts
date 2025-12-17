import type { NumberFieldValue } from '@/store/statusData';
import type { Field } from '@/type/settings';
import { logger } from '@/utils/logger';
import { eventSource, event_types } from '@sillytavern/script';
import { getContext } from '@sillytavern/scripts/extensions';
import { parse as parseYAML } from 'yaml';

/**
 * 從訊息文字中解析 ```myst 代碼框
 * @param messageText 訊息文字
 * @returns 解析後的資料物件，如果沒有找到則返回 null
 */
export function parseMinguCodeBlock(messageText: string): Record<string, any> | null {
  if (!messageText) return null;

  // 尋找 ```myst 開頭的代碼框
  const codeBlockRegex = /```myst\s*\n([\s\S]*?)```/;
  const match = messageText.match(codeBlockRegex);

  if (!match) return null;

  let codeContent = match[1].trim();

  // 預處理 YAML：修復常見的格式問題
  // 1. 處理未引用的星號開頭的值 (例如: key: *value* 會被 YAML 當作錨點)
  // 2. 處理冒號開頭的值 (例如: key: :value 會造成解析錯誤)
  codeContent = codeContent.replace(
    /^(\s*)([^:\s]+)\s*:\s*([*:：].*)$/gm,
    (match, indent, key, value) => {
      // 如果值已經有引號，跳過
      if (value.trim().startsWith('"') || value.trim().startsWith("'")) {
        return match;
      }
      // 自動加上雙引號
      return `${indent}${key}: "${value.trim()}"`;
    }
  );

  try {
    // 嘗試解析為 YAML
    const data = parseYAML(codeContent);
    logger.log('[messageParser] 成功解析 myst 代碼塊');
    return data;
  } catch (error) {
    logger.error('[messageParser] 解析 myst 代碼塊失敗:', error);
    return null;
  }
}

/**
 * 處理解析後的資料，將其轉換為固定欄位和動態欄位
 * @param rawData 從 YAML 解析出的原始資料
 * @param fields 用戶設定的欄位列表
 * @returns 處理後的資料結構
 */
export function processStatusData(
  rawData: Record<string, any>,
  fields: Field[]
): {
  date: string;
  location: string;
  weather: string;
  news: { type: string; title: string; content: string };
  customFields: Record<string, string | number | NumberFieldValue>;
} {
  // 固定欄位（優先使用英文 key，中文作為備用以保持向後兼容）
  const fixedData = {
    date: rawData['time'] || rawData['時間'] || rawData['date'] || '',
    location: rawData['place'] || rawData['地點'] || rawData['location'] || '',
    weather: rawData['weather'] || rawData['天氣'] || '',
    news: {
      type: rawData['news']?.['type'] || rawData['新鮮事']?.['類型'] || '',
      title: rawData['news']?.['title'] || rawData['新鮮事']?.['標題'] || '',
      content: rawData['news']?.['content'] || rawData['新鮮事']?.['內文'] || '',
    },
  };

  // 動態欄位：根據用戶設定的欄位名稱來匹配
  const customFields: Record<string, string | number | NumberFieldValue> = {};

  for (const field of fields) {
    if (!field.enabled) continue; // 只處理啟用的欄位

    const fieldName = field.name;
    if (fieldName && rawData[fieldName] !== undefined) {
      // 根據欄位類型轉換資料
      if (field.type === 'number') {
        const rawValue = String(rawData[fieldName]).trim();
        const cleanValue = rawValue.replace(/%$/, ''); // 移除結尾的 % 用於計算
        const numValue = Number(cleanValue);


        // 如果成功轉換為數字，存儲數值和原始顯示文字
        if (!isNaN(numValue)) {
          customFields[field.id] = {
            value: numValue,      // 用於進度條計算
            display: rawValue     // 用於顯示（保留 %）
          };
        } else {
          customFields[field.id] = rawData[fieldName];
        }
      } else {
        customFields[field.id] = String(rawData[fieldName]);
      }
    }
  }


  return {
    ...fixedData,
    customFields,
  };
}

/**
 * 從歷史訊息中解析最近一則有效的狀態資料
 * 會從最新的訊息開始向上遍歷，直到找到有效的狀態資料
 * @param fields 用戶設定的欄位列表
 * @returns 解析後的狀態資料，如果找不到則返回 null
 */
export function parseLatestMessage(fields: Field[]) {
  const context = getContext();
  if (!context.chat || context.chat.length === 0) {
    return null;
  }

  // 從後往前遍歷所有 AI 訊息，直到找到有效的狀態資料
  for (let i = context.chat.length - 1; i >= 0; i--) {
    const message = context.chat[i];

    // 跳過使用者訊息和系統訊息
    if (message.is_user || message.is_system) {
      continue;
    }

    // 取得當前 swipe 的訊息內容
    const messageText = message.swipes?.[message.swipe_id] || message.mes;

    // 嘗試解析狀態資料
    const rawData = parseMinguCodeBlock(messageText);
    if (rawData) {
      // 找到有效的狀態資料，處理並返回
      logger.log(`[messageParser] 在訊息 #${i} 找到有效的狀態資料`);
      return processStatusData(rawData, fields);
    }
  }

  // 遍歷完所有訊息都沒找到
  logger.log('[messageParser] 未找到任何有效的狀態資料');
  return null;
}

/**
 * 初始化訊息監聽器
 * @param onStatusUpdate 當狀態更新時的回調函數
 * @param onStatusClear 當需要清空狀態時的回調函數
 * @param getFields 取得當前欄位設定的函數
 */
export function initMessageListener(
  onStatusUpdate: (data: ReturnType<typeof processStatusData>) => void,
  onStatusClear: () => void,
  getFields: () => Field[]
) {
  logger.log('[messageParser] 初始化訊息監聽器');

  // 統一的處理函數
  const handleMessageUpdate = () => {
    const fields = getFields();
    const data = parseLatestMessage(fields);
    if (data) {
      onStatusUpdate(data);
    } else {
      onStatusClear();
    }
  };

  // 監聽 AI 訊息接收
  eventSource.on(event_types.MESSAGE_RECEIVED, () => {
    logger.log('[messageParser] 收到 AI 訊息');
    handleMessageUpdate();
  });

  // 監聽訊息 swipe
  eventSource.on(event_types.MESSAGE_SWIPED, () => {
    logger.log('[messageParser] 訊息已 swipe');
    handleMessageUpdate();
  });

  // 監聽訊息編輯
  eventSource.on(event_types.MESSAGE_EDITED, () => {
    logger.log('[messageParser] 訊息已編輯');
    handleMessageUpdate();
  });

  // 監聽聊天切換（包含新建聊天）
  eventSource.on(event_types.CHAT_CHANGED, () => {
    logger.log('[messageParser] 聊天已切換');
    handleMessageUpdate();
  });

  // 監聽訊息刪除
  eventSource.on(event_types.MESSAGE_DELETED, () => {
    logger.log('[messageParser] 訊息已刪除');
    handleMessageUpdate();
  });

  // 初始載入時也執行一次
  handleMessageUpdate();
}
