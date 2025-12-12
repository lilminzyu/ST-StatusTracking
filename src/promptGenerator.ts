import type { Field } from '@/type/settings';
import { eventSource, event_types, extension_prompt_roles, extension_prompt_types, setExtensionPrompt } from '@sillytavern/script';
import { logger } from '@/utils/logger';

/**
 * 固定欄位的 prompt 模板
 */
const FIXED_PROMPT_TEMPLATE = `狀態欄:
在 所有文字 結束之後必須生成以下代碼塊(含)狀態欄:
**與上一輪不允許相同**
\`\`\`myst
時間: \${當前時間, 格式為 yyyy年MM月dd日．星期．HH時mm分}
地點: \${當前劇情地點, 格式為 地點層1．地點層2}
天氣: \${當前劇情天日或環境溫度, 格式為 文雅形容天氣光線．溫度．天氣}
新聞:
  標題: \${當前電視上可能播放的新聞標題。可以是社會新聞、研究新聞、科普新聞, 需與劇情或者人物相關。帶點幽默微搞笑。}
  內文: \${這則新聞的內文,以新聞語氣100字以內播報。}`;

/**
 * 生成狀態欄 prompt
 * @param fields 用戶自訂的欄位列表
 * @returns 完整的 prompt 字串
 */
export function generateStatusPrompt(fields: Field[]): string {
  // 動態欄位 prompt
  const dynamicPrompt = fields
    .filter(f => f.enabled)
    .map(f => {
      // 如果有描述就加上，沒有就只顯示欄位名稱
      if (f.description && f.description.trim()) {
        return `${f.name}: \${${f.description}}`;
      } else {
        return `${f.name}: \${${f.name}的值}`;
      }
    })
    .join('\n');

  // 組合
  const fullPrompt = dynamicPrompt
    ? `${FIXED_PROMPT_TEMPLATE}\n${dynamicPrompt}\n\`\`\``
    : `${FIXED_PROMPT_TEMPLATE}\n\`\`\``;

  return fullPrompt;
}

// 儲存當前的 fields 配置
let currentFields: Field[] = [];
let isEnabled = false;

/**
 * 啟用狀態欄 prompt 注入
 * @param fields 用戶自訂的欄位列表
 */
export function enablePromptInjection(fields: Field[]): void {
  currentFields = fields;
  isEnabled = true;
  logger.log('Prompt injection enabled, fields count:', fields.length);
}

/**
 * 停用狀態欄 prompt 注入
 */
export function disablePromptInjection(): void {
  isEnabled = false;
  logger.log('Prompt injection disabled');

  // 清除所有注入的 prompt
  setExtensionPrompt('status-tracking-prompt', '', extension_prompt_types.IN_CHAT, 0, false);
}

/**
 * 在每次生成開始時注入 prompt（由 GENERATION_STARTED 事件觸發）
 */
function onGenerationStarted(): void {
  logger.log('GENERATION_STARTED event triggered, isEnabled:', isEnabled);

  if (!isEnabled) {
    // 如果未啟用，確保清除任何殘留的 prompt
    logger.log('Injection disabled, clearing prompt');
    setExtensionPrompt('status-tracking-prompt', '', extension_prompt_types.IN_CHAT, 0, false);
    return;
  }

  const prompt = generateStatusPrompt(currentFields);

  logger.log('Injecting status prompt');
  logger.log('Prompt content:', prompt);
  logger.log('Current fields count:', currentFields.length);

  // 注入 prompt 到深度 0（最後一條訊息之後）
  setExtensionPrompt(
    'status-tracking-prompt',           // 唯一 key
    prompt,                              // prompt 內容
    extension_prompt_types.IN_CHAT,     // 在對話中插入
    0,                                   // 深度 0（最後一條訊息後）
    false,                               // 不參與 world info 掃描
    extension_prompt_roles.SYSTEM       // SYSTEM 角色
  );

  logger.log('Prompt injection completed');
}

/**
 * 初始化 prompt 注入系統
 */
export function initPromptInjection(): void {
  logger.log('Initializing prompt injection system');

  // 監聽生成開始事件
  eventSource.on(event_types.GENERATION_STARTED, onGenerationStarted);

  logger.log('GENERATION_STARTED event listener registered');
}
