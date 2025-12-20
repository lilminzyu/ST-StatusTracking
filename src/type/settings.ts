import { generateUUID } from '@/utils/uuid';
import { z } from 'zod';

// 1. 先定義 type（用來給其他地方 import）
export type Field = {
  id: string;
  enabled: boolean;
  name: string;
  description: string;
  order: number;
  type: 'number' | 'text';
}

// 2. Field schema
const FieldSchema = z.object({
  id: z.string(),
  enabled: z.boolean(),
  name: z.string(),
  description: z.string(),
  order: z.number(),
  type: z.enum(['number', 'text']).default('number'),
});

// 3. Custom Prompt schema
const CustomPromptSchema = z.object({
  time: z.string().optional(),
  place: z.string().optional(),
  weather: z.string().optional(),
  newsType: z.string().optional(),
  newsTitle: z.string().optional(),
  newsContent: z.string().optional(),
  notes: z.string().optional(),
});

// 4. Fixed Fields Enabled schema（固定欄位的啟用/停用開關）
const FixedFieldsEnabledSchema = z.object({
  time: z.boolean().default(true),
  place: z.boolean().default(true),
  weather: z.boolean().default(true),
  news: z.boolean().default(true),
  notes: z.boolean().default(true),
});

// 5. Settings schema
export const Settings = z
  .object({
    button_selected: z.boolean().default(false),
    panel_enabled: z.boolean().default(false),
    panel_position: z.enum(['left', 'right']).default('right'),
    panel_collapsed: z.boolean().default(false),
    fields: z.array(FieldSchema).default([
      // 預設自訂欄位
      {
        id: generateUUID(),
        enabled: true,
        name: '好感度',
        description: '<char>目前對<user>的好感度, 0-100%, 每次±不可超過0.5',
        order: 0,
        type: 'number' as const,
      },
      {
        id: generateUUID(),
        enabled: true,
        name: '內心話',
        description: '<char>當前\'正文\'劇情內心第一人稱想法, 100字內',
        order: 1,
        type: 'text' as const,
      },
    ]),
    language: z.enum(['zh-TW', 'zh-CN', 'en']).default('zh-TW'),
    progress_color_low: z.string().default('#d8b4a0'),  // 莫蘭迪粉
    progress_color_high: z.string().default('#a0b4d8'), // 莫蘭迪藍
    debug_mode: z.boolean().default(false), // Debug 模式
    custom_prompt: CustomPromptSchema.optional(), // 自訂 prompt
    fixed_fields_enabled: FixedFieldsEnabledSchema.default({
      time: true,
      place: true,
      weather: true,
      news: true,
      notes: true,
    }), // 固定欄位開關
    custom_css: z.string().default(''), // 用戶自訂 CSS（為未來功能預留）
  })
  .prefault({});

// 6. 從 zod schema 推導出 TypeScript type
export type Settings = z.infer<typeof Settings>;
export type CustomPrompt = z.infer<typeof CustomPromptSchema>;
export type FixedFieldsEnabled = z.infer<typeof FixedFieldsEnabledSchema>;

// 7. 存檔鍵名
export const setting_field = 'status_tracking';