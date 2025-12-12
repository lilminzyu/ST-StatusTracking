import type { Field, FixedFieldsEnabled } from '@/type/settings';
import { logger } from '@/utils/logger';
import { eventSource, event_types, extension_prompt_roles, extension_prompt_types, setExtensionPrompt } from '@sillytavern/script';

/**
 * 預設 prompt 模板（繁體中文）
 */
export const DEFAULT_PROMPT_ZH_TW = {
  time: '當前時間, 格式為 yyyy年MM月dd日．星期．HH時mm分',
  place: '當前劇情地點, 格式為 地點層1．地點層2',
  weather: '當前劇情天日或環境溫度, 格式為 文雅形容天氣光線．溫度．天氣',
  newsTitle: '當前電視上可能播放的新聞標題。可以是社會新聞、研究新聞、科普新聞, 強制必需與劇情或者人物相關。帶點幽默微搞笑。',
  newsContent: '這則新聞的內文,以新聞語氣100字以內播報。',
};

/**
 * 預設 prompt 模板（英文）
 */
export const DEFAULT_PROMPT_EN = {
  time: 'Current time, format: yyyy-MM-dd, Weekday, HH:mm',
  place: 'Current story location, format: Location Layer 1 . Location Layer 2',
  weather: 'Current weather or environment temperature, format: Elegant description of light . Temperature . Weather',
  newsTitle: 'News headline that might be playing on TV. Can be social news, research news, science news, related to the plot or characters. A bit humorous and funny.',
  newsContent: 'News content, broadcast in news tone within 100 words.',
};

/**
 * 根據語言和自訂 prompt 生成固定欄位的 prompt 字串
 */
export function buildFixedPrompt(
  language: 'zh-TW' | 'en',
  fixedFieldsEnabled: FixedFieldsEnabled,
  customPrompt?: {
    time?: string;
    place?: string;
    weather?: string;
    newsTitle?: string;
    newsContent?: string;
  }
): string {
  const defaultPrompt = language === 'en' ? DEFAULT_PROMPT_EN : DEFAULT_PROMPT_ZH_TW;
  const prompt = customPrompt || defaultPrompt;

  const header = language === 'en'
    ? 'Status Bar:\nAfter all text, you must generate the following code block status bar:\n**Must be different from the previous round and output in English**'
    : '狀態欄:\n在 所有文字 結束之後必須生成以下代碼塊(含)狀態欄:\n**與上一輪不允許相同, 並且使用中文輸出**';

  // 根據開關決定要輸出哪些欄位
  const lines: string[] = [];

  if (fixedFieldsEnabled.time) {
    lines.push(`time: \${${prompt.time || defaultPrompt.time}}`);
  }
  if (fixedFieldsEnabled.place) {
    lines.push(`place: \${${prompt.place || defaultPrompt.place}}`);
  }
  if (fixedFieldsEnabled.weather) {
    lines.push(`weather: \${${prompt.weather || defaultPrompt.weather}}`);
  }
  if (fixedFieldsEnabled.news) {
    lines.push(`news:\n  title: \${${prompt.newsTitle || defaultPrompt.newsTitle}}\n  content: \${${prompt.newsContent || defaultPrompt.newsContent}}`);
  }

  return `${header}
\`\`\`myst
${lines.join('\n')}`;
}

/**
 * 生成狀態欄 prompt
 * @param fields 用戶自訂的欄位列表
 * @param language 語言
 * @param fixedFieldsEnabled 固定欄位開關
 * @param customPrompt 自訂的 prompt（可選）
 * @returns 完整的 prompt 字串
 */
export function generateStatusPrompt(
  fields: Field[],
  language: 'zh-TW' | 'en' = 'zh-TW',
  fixedFieldsEnabled: FixedFieldsEnabled = {
    time: true,
    place: true,
    weather: true,
    news: true,
  },
  customPrompt?: {
    time?: string;
    place?: string;
    weather?: string;
    newsTitle?: string;
    newsContent?: string;
  }
): string {
  const fixedPrompt = buildFixedPrompt(language, fixedFieldsEnabled, customPrompt);

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
    ? `${fixedPrompt}\n${dynamicPrompt}\n\`\`\``
    : `${fixedPrompt}\n\`\`\``;

  return fullPrompt;
}

// 儲存當前的配置
let currentFields: Field[] = [];
let currentLanguage: 'zh-TW' | 'en' = 'zh-TW';
let currentFixedFieldsEnabled: FixedFieldsEnabled = {
  time: true,
  place: true,
  weather: true,
  news: true,
};
let currentCustomPrompt: {
  time?: string;
  place?: string;
  weather?: string;
  newsTitle?: string;
  newsContent?: string;
} | undefined = undefined;
let isEnabled = false;

/**
 * 啟用狀態欄 prompt 注入
 * @param fields 用戶自訂的欄位列表
 * @param language 語言
 * @param fixedFieldsEnabled 固定欄位開關
 * @param customPrompt 自訂 prompt
 */
export function enablePromptInjection(
  fields: Field[],
  language: 'zh-TW' | 'en' = 'zh-TW',
  fixedFieldsEnabled: FixedFieldsEnabled = {
    time: true,
    place: true,
    weather: true,
    news: true,
  },
  customPrompt?: {
    time?: string;
    place?: string;
    weather?: string;
    newsTitle?: string;
    newsContent?: string;
  }
): void {
  currentFields = fields;
  currentLanguage = language;
  currentFixedFieldsEnabled = fixedFieldsEnabled;
  currentCustomPrompt = customPrompt;
  isEnabled = true;
  logger.log('Prompt injection enabled, fields count:', fields.length, 'language:', language);
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

  const prompt = generateStatusPrompt(currentFields, currentLanguage, currentFixedFieldsEnabled, currentCustomPrompt);

  logger.log('Injecting status prompt');
  logger.log('Language:', currentLanguage);
  logger.log('Fixed fields enabled:', currentFixedFieldsEnabled);
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
