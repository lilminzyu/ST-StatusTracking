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

// 3. Settings schema
export const Settings = z
  .object({
    button_selected: z.boolean().default(false),
    panel_enabled: z.boolean().default(false),
    panel_position: z.enum(['left', 'right']).default('right'),
    panel_collapsed: z.boolean().default(false),
    fields: z.array(FieldSchema).default([]),
    language: z.enum(['zh-TW', 'en']).default('zh-TW'),
    progress_color_low: z.string().default('#d8b4a0'),  // 莫蘭迪粉
    progress_color_high: z.string().default('#a0b4d8'), // 莫蘭迪藍
  })
  .prefault({});

// 4. 從 zod schema 推導出 TypeScript type
export type Settings = z.infer<typeof Settings>;

// 5. 存檔鍵名
export const setting_field = 'status_tracking';