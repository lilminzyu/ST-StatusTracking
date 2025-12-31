/**
 * 共用的 Pinia 實例
 * 所有 Vue App 都應該使用這個實例，確保 store 狀態共享
 */
import { createPinia } from 'pinia';

export const pinia = createPinia();
