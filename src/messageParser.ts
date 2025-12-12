import type { Field } from '@/type/settings';
import type { NumberFieldValue } from '@/store/statusData';
import { eventSource, event_types } from '@sillytavern/script';
import { getContext } from '@sillytavern/scripts/extensions';
import { parse as parseYAML } from 'yaml';
import { logger } from '@/utils/logger';

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

  const codeContent = match[1].trim();

  try {
    // 嘗試解析為 YAML
    const data = parseYAML(codeContent);
    logger.log('Successfully parsed myst code block:', data);
    return data;
  } catch (error) {
    logger.error('Failed to parse myst code block:', error);
    logger.error('Raw content:', codeContent);
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
  news: { title: string; content: string };
  customFields: Record<string, string | number | NumberFieldValue>;
} {
  // 固定欄位（優先使用英文 key，中文作為備用以保持向後兼容）
  const fixedData = {
    date: rawData['time'] || rawData['時間'] || rawData['date'] || '',
    location: rawData['place'] || rawData['地點'] || rawData['location'] || '',
    weather: rawData['weather'] || rawData['天氣'] || '',
    news: {
      title: rawData['news']?.['title'] || rawData['新聞']?.['標題'] || '',
      content: rawData['news']?.['content'] || rawData['新聞']?.['內文'] || '',
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

        logger.log(`[messageParser] Field: ${fieldName}, raw: "${rawValue}", clean: "${cleanValue}", number: ${numValue}, isNaN: ${isNaN(numValue)}`);

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

  logger.log('Processed status data:', { ...fixedData, customFields });

  return {
    ...fixedData,
    customFields,
  };
}

/**
 * 取得最新的 AI 訊息
 */
function getLatestAIMessage(): any | null {
  const context = getContext();
  if (!context.chat || context.chat.length === 0) return null;

  // 從後往前找第一個 AI 訊息（非使用者、非系統訊息）
  for (let i = context.chat.length - 1; i >= 0; i--) {
    const message = context.chat[i];
    if (!message.is_user && !message.is_system) {
      return message;
    }
  }

  return null;
}

/**
 * 從最新的 AI 訊息中解析狀態資料
 * @param fields 用戶設定的欄位列表
 */
export function parseLatestMessage(fields: Field[]) {
  const message = getLatestAIMessage();
  if (!message) {
    logger.log('No AI message found');
    return null;
  }

  // 取得當前 swipe 的訊息內容
  const messageText = message.swipes?.[message.swipe_id] || message.mes;

  logger.log('Analyzing message:', messageText.substring(0, 100) + '...');

  const rawData = parseMinguCodeBlock(messageText);
  if (!rawData) return null;

  // 處理並轉換資料
  return processStatusData(rawData, fields);
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
  logger.log('Initializing message listener');

  // 統一的處理函數
  const handleMessageUpdate = () => {
    const fields = getFields();
    const data = parseLatestMessage(fields);
    if (data) {
      onStatusUpdate(data);
    } else {
      // 如果沒有找到資料，清空狀態顯示
      logger.log('No myst code block found, clearing status display');
      onStatusClear();
    }
  };

  // 監聽 AI 訊息接收
  eventSource.on(event_types.MESSAGE_RECEIVED, () => {
    logger.log('MESSAGE_RECEIVED event');
    handleMessageUpdate();
  });

  // 監聽訊息 swipe
  eventSource.on(event_types.MESSAGE_SWIPED, (messageId: number) => {
    logger.log('MESSAGE_SWIPED event, messageId:', messageId);
    handleMessageUpdate();
  });

  // 監聽訊息編輯
  eventSource.on(event_types.MESSAGE_EDITED, (messageId: number) => {
    logger.log('MESSAGE_EDITED event, messageId:', messageId);
    handleMessageUpdate();
  });

  // 監聽聊天切換（包含新建聊天）
  eventSource.on(event_types.CHAT_CHANGED, () => {
    logger.log('CHAT_CHANGED event');
    handleMessageUpdate();
  });

  // 初始載入時也執行一次
  handleMessageUpdate();
}
