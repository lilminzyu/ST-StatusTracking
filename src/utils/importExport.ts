/**
 * 匯出/匯入工具函數
 * 用於備份和還原狀態追蹤設定
 */

import type { Preset, PresetData, Settings } from '@/type/settings';
import { writeExtensionField } from '@sillytavern/scripts/extensions';
import { getContext } from '@sillytavern/scripts/st-context';
import { logger } from './logger';
import { generateUUID } from './uuid';

/**
 * 匯出資料格式
 */
export interface ExportData {
  version: string;           // 擴充版本號
  timestamp: number;         // 匯出時間戳
  fields: Settings['fields'];              // 自訂欄位
  customPrompt?: Settings['custom_prompt']; // 自訂 Prompt
  fixedFieldsEnabled: Settings['fixed_fields_enabled']; // 固定欄位開關
  customCSS: Settings['custom_css'];       // 自訂 CSS
  progressColorLow: Settings['progress_color_low'];   // 進度條低值顏色
  progressColorHigh: Settings['progress_color_high']; // 進度條高值顏色
  language: Settings['language'];          // 語言設定
}

/**
 * 匯出設定為 JSON
 */
export function exportSettings(settings: Settings, version: string): ExportData {
  logger.log('[importExport] 開始匯出設定');

  const exportData: ExportData = {
    version,
    timestamp: Date.now(),
    fields: settings.fields,
    customPrompt: settings.custom_prompt,
    fixedFieldsEnabled: settings.fixed_fields_enabled,
    customCSS: settings.custom_css,
    progressColorLow: settings.progress_color_low,
    progressColorHigh: settings.progress_color_high,
    language: settings.language,
  };

  logger.log('[importExport] 匯出資料:', exportData);
  return exportData;
}

/**
 * 下載 JSON 檔案
 */
export function downloadJSON(data: ExportData, filename?: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `status-tracking-backup-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  logger.log('[importExport] JSON 已下載:', a.download);
}

/**
 * 從檔案讀取 JSON
 */
export async function readJSONFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        logger.log('[importExport] JSON 已讀取:', data);
        resolve(data);
      } catch (error) {
        logger.error('[importExport] JSON 解析失敗:', error);
        reject(new Error('JSON 格式錯誤'));
      }
    };

    reader.onerror = () => {
      logger.error('[importExport] 檔案讀取失敗');
      reject(new Error('檔案讀取失敗'));
    };

    reader.readAsText(file);
  });
}

/**
 * 驗證匯入資料
 */
export function validateImportData(data: any): {
  valid: boolean;
  error?: string;
  data?: Partial<Settings>;
} {
  logger.log('[importExport] 開始驗證匯入資料');

  // 檢查基本結構
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '無效的資料格式' };
  }

  // 檢查版本（警告但不阻止）
  if (data.version && typeof data.version === 'string') {
    logger.log('[importExport] 匯入資料版本:', data.version);
  }

  try {
    // 構建要匯入的設定物件
    const settingsToImport: Partial<Settings> = {};

    // 驗證並匯入各個欄位
    if (data.fields !== undefined) {
      settingsToImport.fields = data.fields;
    }

    if (data.customPrompt !== undefined) {
      settingsToImport.custom_prompt = data.customPrompt;
    }

    if (data.fixedFieldsEnabled !== undefined) {
      settingsToImport.fixed_fields_enabled = data.fixedFieldsEnabled;
    }

    if (data.customCSS !== undefined) {
      settingsToImport.custom_css = data.customCSS;
    }

    if (data.progressColorLow !== undefined) {
      settingsToImport.progress_color_low = data.progressColorLow;
    }

    if (data.progressColorHigh !== undefined) {
      settingsToImport.progress_color_high = data.progressColorHigh;
    }

    if (data.language !== undefined) {
      settingsToImport.language = data.language;
    }

    logger.log('[importExport] 驗證成功，準備匯入:', settingsToImport);
    return { valid: true, data: settingsToImport };
  } catch (error) {
    logger.error('[importExport] 驗證失敗:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : '驗證失敗',
    };
  }
}

/**
 * 打開檔案選擇器
 */
export function openFileSelector(accept: string = '.json'): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

/**
 * 角色卡擴充資料格式
 * 注意：不包含 UI 偏好設定（panel_position, panel_collapsed, debug_mode）
 */
export interface CharacterCardExtensionData {
  version: number;                              // 資料版本（方便未來升級）
  fields: Settings['fields'];                   // 自訂欄位
  customPrompt?: Settings['custom_prompt'];     // 自訂 Prompt
  fixedFieldsEnabled: Settings['fixed_fields_enabled']; // 固定欄位開關
  customCSS: Settings['custom_css'];            // 自訂 CSS
  progressColorLow: Settings['progress_color_low'];   // 進度條低值顏色
  progressColorHigh: Settings['progress_color_high']; // 進度條高值顏色
}

/**
 * 角色卡擴充資料的 key（使用有前綴的名稱避免衝突）
 */
export const CHARACTER_EXTENSION_KEY = 'st_status_tracking';

/**
 * 從設定建構角色卡擴充資料
 */
export function buildCharacterExtensionData(settings: Settings): CharacterCardExtensionData {
  return {
    version: 1,
    fields: settings.fields,
    customPrompt: settings.custom_prompt,
    fixedFieldsEnabled: settings.fixed_fields_enabled,
    customCSS: settings.custom_css,
    progressColorLow: settings.progress_color_low,
    progressColorHigh: settings.progress_color_high,
  };
}

/**
 * 儲存設定到目前角色卡
 * @returns 成功與否
 */
export async function saveSettingsToCharacterCard(settings: Settings): Promise<boolean> {
  try {
    const context = getContext();
    const characterId = context.characterId;

    if (characterId === undefined || characterId === null) {
      logger.warn('[importExport] 沒有選擇角色，無法儲存到角色卡');
      return false;
    }

    const extensionData = buildCharacterExtensionData(settings);

    logger.log('[importExport] 儲存設定到角色卡:', {
      characterId,
      extensionData,
    });

    await writeExtensionField(characterId, CHARACTER_EXTENSION_KEY, extensionData);

    logger.log('[importExport] 儲存成功');
    return true;
  } catch (error) {
    logger.error('[importExport] 儲存到角色卡失敗:', error);
    return false;
  }
}

/**
 * 從角色卡讀取設定
 * @returns 設定資料，如果沒有則返回 null
 */
export function loadSettingsFromCharacterCard(): Partial<Settings> | null {
  try {
    const context = getContext();
    const characterId = context.characterId;

    if (characterId === undefined || characterId === null) {
      logger.log('[importExport] 沒有選擇角色');
      return null;
    }

    const character = (context.characters as any)?.[characterId];
    if (!character) {
      logger.log('[importExport] 找不到角色資料');
      return null;
    }

    const extensionData = (character as any).data?.extensions?.[CHARACTER_EXTENSION_KEY] as CharacterCardExtensionData | undefined;

    if (!extensionData) {
      logger.log('[importExport] 角色卡沒有狀態追蹤設定');
      return null;
    }

    logger.log('[importExport] 從角色卡讀取設定:', extensionData);

    // 轉換為 Settings 格式
    const settingsData: Partial<Settings> = {
      fields: extensionData.fields,
      custom_prompt: extensionData.customPrompt,
      fixed_fields_enabled: extensionData.fixedFieldsEnabled,
      custom_css: extensionData.customCSS,
      progress_color_low: extensionData.progressColorLow,
      progress_color_high: extensionData.progressColorHigh,
    };

    return settingsData;
  } catch (error) {
    logger.error('[importExport] 從角色卡讀取設定失敗:', error);
    return null;
  }
}

/**
 * 檢查目前角色卡是否有狀態追蹤設定
 */
export function hasCharacterCardSettings(): boolean {
  const context = getContext();
  const characterId = context.characterId;

  if (characterId === undefined || characterId === null) {
    return false;
  }

  const character = (context.characters as any)?.[characterId];
  if (!character) {
    return false;
  }

  return !!character.data?.extensions?.[CHARACTER_EXTENSION_KEY];
}

// ============ 配置預設管理 ============

/**
 * 從當前設定建立 PresetData
 * 使用深拷貝確保 Vue Proxy 物件被正確序列化
 */
export function buildPresetData(settings: Settings): PresetData {
  return {
    // 深拷貝 fields 陣列，確保每個 field 的所有屬性都被保存
    fields: settings.fields.map(field => ({
      id: field.id,
      enabled: field.enabled,
      name: field.name,
      description: field.description,
      order: field.order,
      type: field.type,
    })),
    // 深拷貝 customPrompt
    customPrompt: settings.custom_prompt ? { ...settings.custom_prompt } : undefined,
    // 深拷貝 fixedFieldsEnabled
    fixedFieldsEnabled: { ...settings.fixed_fields_enabled },
    customCSS: settings.custom_css,
    progressColorLow: settings.progress_color_low,
    progressColorHigh: settings.progress_color_high,
  };
}

/**
 * 建立新的配置預設
 */
export function createPreset(name: string, settings: Settings): Preset {
  return {
    id: generateUUID(),
    name,
    createdAt: Date.now(),
    data: buildPresetData(settings),
  };
}

/**
 * 將 PresetData 轉換為 Partial<Settings>
 */
export function presetDataToSettings(data: PresetData): Partial<Settings> {
  return {
    fields: data.fields,
    custom_prompt: data.customPrompt,
    fixed_fields_enabled: data.fixedFieldsEnabled,
    custom_css: data.customCSS,
    progress_color_low: data.progressColorLow,
    progress_color_high: data.progressColorHigh,
  };
}

/**
 * 取得當前角色卡的配置（如果有的話）
 * 返回格式類似 Preset，但 id 為特殊值
 */
export function getCurrentCharacterPreset(): Preset | null {
  const cardSettings = loadSettingsFromCharacterCard();
  if (!cardSettings) return null;

  const context = getContext();
  const characterId = context.characterId;
  if (characterId === undefined || characterId === null) return null;

  const character = (context.characters as any)?.[characterId];
  const characterName = character?.name || '角色';

  return {
    id: `__character_${characterId}`,
    name: characterName,
    createdAt: 0, // 角色卡配置不需要時間戳
    data: {
      fields: cardSettings.fields || [],
      customPrompt: cardSettings.custom_prompt,
      fixedFieldsEnabled: cardSettings.fixed_fields_enabled || {
        time: true,
        place: true,
        weather: true,
        news: true,
        notes: true,
      },
      customCSS: cardSettings.custom_css || '',
      progressColorLow: cardSettings.progress_color_low || '#d8b4a0',
      progressColorHigh: cardSettings.progress_color_high || '#a0b4d8',
    },
  };
}
