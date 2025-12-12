/**
 * 生成 UUID v4
 * 兼容不支援 crypto.randomUUID 的環境
 */
export function generateUUID(): string {
  // 優先使用原生 crypto.randomUUID
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: 使用 Math.random 生成 UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
