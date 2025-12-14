import type { Field, FixedFieldsEnabled } from '@/type/settings';
import { logger } from '@/utils/logger';
import { eventSource, event_types, extension_prompt_roles, extension_prompt_types, setExtensionPrompt } from '@sillytavern/script';

/**
 * 預設 prompt 模板（繁體中文）
 */
export const DEFAULT_PROMPT_ZH_TW = {
  time: '當前時間, 格式為 yyyy年MM月dd日．星期．HH時mm分',
  place: '當前劇情地點, 格式為 地點層1．地點層2．地點層3',
  weather: '當前劇情天氣或環境溫度, 格式為 文雅形容天氣光線．溫度．天氣',
  newsTitle: '當前社會上發生的事物標題。可以是科普新聞、論壇爆紅帖, 強制必需與劇情或者人物相關。帶點幽默微搞笑神經, 與上一輪不可相同類型, 每一輪都要不同類型, 請發揮想像力',
  newsContent: '這則事物的內文,如果是新聞就以新聞語氣播報、如果是論壇就以網友網路言論語氣為主, 以此類推。100字以內',
};

/**
 * 預設 prompt 模板（簡體中文）
 */
export const DEFAULT_PROMPT_ZH_CN = {
  time: '当前时间, 格式为 yyyy年MM月dd日．星期．HH时mm分',
  place: '当前剧情地点, 格式为 地点层1．地点层2．地点层3',
  weather: '当前剧情天气或环境温度, 格式为 文雅形容天气光线．温度．天气',
  newsTitle: '当前社会上发生的事物标题。可以是科普新闻、论坛爆红帖, 强制必需与剧情或者人物相关。带点幽默微搞笑神经, 与上一轮不可相同类型, 每一轮都要不同类型, 请发挥想象力',
  newsContent: '这则事物的内文,如果是新闻就以新闻语气播报、如果是论坛就以网友网络言论语气为主, 以此类推。100字以内',
};

/**
 * 預設 prompt 模板（英文）
 */
export const DEFAULT_PROMPT_EN = {
  time: 'Current time, format: yyyy-MM-dd, Weekday, HH:mm',
  place: 'Current story location, format: Location Layer 1 . Location Layer 2 . Location Layer 3',
  weather: 'Current weather or environment temperature, format: Elegant description of light . Temperature . Weather',
  newsTitle: 'Current event headline in society. Can be science news, viral forum posts, must be related to the plot or characters. A bit humorous and funny, must be different type from previous round, each round must have different type, use your imagination',
  newsContent: 'The content of this event, if it\'s news then broadcast in news tone, if it\'s forum then use netizen internet speech tone, and so on. Within 100 words',
};

/**
 * 根據語言和自訂 prompt 生成固定欄位的 prompt 字串
 */
export function buildFixedPrompt(
  language: 'zh-TW' | 'zh-CN' | 'en',
  fixedFieldsEnabled: FixedFieldsEnabled,
  customPrompt?: {
    time?: string;
    place?: string;
    weather?: string;
    newsTitle?: string;
    newsContent?: string;
  }
): string {
  const defaultPrompt = language === 'en'
    ? DEFAULT_PROMPT_EN
    : language === 'zh-CN'
      ? DEFAULT_PROMPT_ZH_CN
      : DEFAULT_PROMPT_ZH_TW;
  const prompt = customPrompt || defaultPrompt;

  const header = language === 'en'
    ? 'Status Bar:\nAfter all text, you must generate the following code block status bar:\n**Must be different from the previous round and output in English**'
    : language === 'zh-CN'
      ? '状态栏:\n在 所有文字 结束之后必须生成以下代码块(含)状态栏:\n**与上一轮不允许相同, 并且使用中文输出**'
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
  language: 'zh-TW' | 'zh-CN' | 'en' = 'zh-TW',
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
let currentLanguage: 'zh-TW' | 'zh-CN' | 'en' = 'zh-TW';
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
  language: 'zh-TW' | 'zh-CN' | 'en' = 'zh-TW',
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
  logger.log('[promptGenerator] 啟用 Prompt 注入');
}

/**
 * 停用狀態欄 prompt 注入
 */
export function disablePromptInjection(): void {
  isEnabled = false;
  logger.log('[promptGenerator] 停用 Prompt 注入');

  // 清除所有注入的 prompt
  setExtensionPrompt('status-tracking-prompt', '', extension_prompt_types.IN_CHAT, 0, false);
}

/**
 * 在每次生成開始時注入 prompt（由 GENERATION_STARTED 事件觸發）
 */
function onGenerationStarted(): void {
  if (!isEnabled) {
    setExtensionPrompt('status-tracking-prompt', '', extension_prompt_types.IN_CHAT, 0, false);
    return;
  }

  const prompt = generateStatusPrompt(currentFields, currentLanguage, currentFixedFieldsEnabled, currentCustomPrompt);
  logger.log('[promptGenerator] 注入 Prompt 到對話');

  // 注入 prompt 到深度 0（最後一條訊息之後）
  setExtensionPrompt(
    'status-tracking-prompt',           // 唯一 key
    prompt,                              // prompt 內容
    extension_prompt_types.IN_CHAT,     // 在對話中插入
    0,                                   // 深度 0（最後一條訊息後）
    false,                               // 不參與 world info 掃描
    extension_prompt_roles.SYSTEM       // SYSTEM 角色
  );
}

/**
 * 初始化 prompt 注入系統
 */
export function initPromptInjection(): void {
  logger.log('[promptGenerator] 初始化 Prompt 注入系統');

  // 監聽生成開始事件
  eventSource.on(event_types.GENERATION_STARTED, onGenerationStarted);
}
