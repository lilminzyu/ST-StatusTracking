/**
 * 匯出/匯入工具函數
 * 用於備份和還原狀態追蹤設定
 */

import type { Settings } from '@/type/settings';
import { logger } from './logger';

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
