import '@/global.css';
import { initMessageListener } from '@/messageParser';
import { initMessageRenderer } from '@/messageRenderer';
import { initPanel } from '@/panel';
import { disablePromptInjection, enablePromptInjection, initPromptInjection } from '@/promptGenerator';
import { initStatusPanel } from '@/statusPanel';
import { useSettingsStore } from '@/store/settings';
import { useStatusDataStore } from '@/store/statusData';
import type { PresetData } from '@/type/settings';
import { applyCustomCSS } from '@/utils/cssInjector';
import { buildPresetData, createPreset, loadSettingsFromCharacterCard, presetDataToSettings } from '@/utils/importExport';
import { logger } from '@/utils/logger';
import { event_types, eventSource } from '@sillytavern/script';
import { Popup, POPUP_RESULT, POPUP_TYPE } from '@sillytavern/scripts/popup';
import { getContext } from '@sillytavern/scripts/st-context';

// chat_metadata 中儲存聊天窗暫存設定的 key
const CHAT_SETTINGS_KEY = 'status_tracking_settings';

// 防止載入設定時觸發保存的標記
let isLoadingSettings = false;

$(() => {
  logger.log('[index] 擴充開始初始化');

  initPanel();
  initStatusPanel();
  initMessageRenderer();

  // 取得 store 實例
  const settingsStore = useSettingsStore();
  const statusDataStore = useStatusDataStore();

  // 初始化 Prompt 注入系統
  initPromptInjection();

  // 應用用戶自訂 CSS（如果有）
  applyCustomCSS(settingsStore.settings.custom_css);

  logger.log('[index] 擴充初始化完成');

  // 初始化訊息監聽器
  initMessageListener(
    (data) => {
      logger.log('[index] 收到狀態更新');
      // 更新 statusData store
      statusDataStore.data.date = data.date;
      statusDataStore.data.location = data.location;
      statusDataStore.data.weather = data.weather;
      statusDataStore.data.news = data.news;
      statusDataStore.data.notes = data.notes;
      statusDataStore.data.customFields = data.customFields;
    },
    () => {
      logger.log('[index] 清空狀態資料');
      // 清空 statusData store
      statusDataStore.clearData();
    },
    () => settingsStore.settings.fields // 提供取得欄位設定的函數
  );

  // 監聽 panel_enabled 變化，決定是否注入 prompt
  watch(() => settingsStore.settings.panel_enabled, (enabled) => {
    if (enabled) {
      enablePromptInjection(
        settingsStore.settings.fields,
        settingsStore.settings.language,
        settingsStore.settings.fixed_fields_enabled,
        settingsStore.settings.custom_prompt
      );
    } else {
      disablePromptInjection();
    }
  }, { immediate: true }); // immediate: true 表示立即執行一次

  // 監聽 fields, language, fixed_fields_enabled, custom_prompt 變化，重新注入 prompt
  watch(
    () => [
      settingsStore.settings.fields,
      settingsStore.settings.language,
      settingsStore.settings.fixed_fields_enabled,
      settingsStore.settings.custom_prompt,
    ] as const,
    ([fields, language, fixedFieldsEnabled, customPrompt]) => {
      if (settingsStore.settings.panel_enabled) {
        enablePromptInjection(fields, language, fixedFieldsEnabled, customPrompt);
      }
    },
    { deep: true } // deep: true 表示深度監聽
  );

  // 監聽 custom_css 變化，動態應用 CSS
  watch(
    () => settingsStore.settings.custom_css,
    (newCSS) => {
      applyCustomCSS(newCSS);
      logger.log('[index] 自訂 CSS 已更新');
    }
  );

  // 監聯設定變化，自動保存到當前聊天窗的 metadata
  watch(
    () => [
      settingsStore.settings.fields,
      settingsStore.settings.custom_prompt,
      settingsStore.settings.fixed_fields_enabled,
      settingsStore.settings.custom_css,
      settingsStore.settings.progress_color_low,
      settingsStore.settings.progress_color_high,
    ],
    async () => {
      logger.log('[index] 設定變化 watch 觸發', { isLoadingSettings });
      // 如果正在載入設定，不要觸發保存
      if (isLoadingSettings) {
        logger.log('[index] isLoadingSettings=true，跳過保存');
        return;
      }
      // 等待 Vue 響應式更新完成
      await nextTick();
      // 自動保存當前設定到聊天窗 metadata
      saveChatSettings();
    },
    { deep: true }
  );

  // 監聽聊天窗切換事件
  eventSource.on(event_types.CHAT_CHANGED, () => {
    // 延遲一下確保資料已載入
    setTimeout(async () => {
      const context = getContext();
      const characterId = context.characterId;
      const chatId = context.chatId;
      const chatMetadata = context.chatMetadata as Record<string, any>;

      logger.log('[index] CHAT_CHANGED 事件觸發', {
        characterId,
        chatId,
        hasChatMetadata: !!chatMetadata,
        chatMetadataKeys: chatMetadata ? Object.keys(chatMetadata) : [],
        hasSavedSettings: !!chatMetadata?.[CHAT_SETTINGS_KEY],
      });

      if (characterId === undefined || characterId === null) {
        logger.log('[index] 沒有角色，跳過');
        return;
      }

      const character = (context.characters as any)?.[characterId];
      const characterName = character?.name || '角色';

      // 1. 檢查當前聊天窗是否有暫存設定
      const savedSettings = chatMetadata?.[CHAT_SETTINGS_KEY] as PresetData | undefined;
      logger.log('[index] 檢查暫存設定:', {
        hasSavedSettings: !!savedSettings,
        savedSettings,
      });
      if (savedSettings) {
        logger.log('[index] 載入聊天窗暫存設定', savedSettings);
        isLoadingSettings = true;
        const settingsData = presetDataToSettings(savedSettings);
        logger.log('[index] 轉換後的 settingsData:', settingsData);
        logger.log('[index] 套用前的 settings.fields:', JSON.stringify(settingsStore.settings.fields));
        Object.assign(settingsStore.settings, settingsData);
        logger.log('[index] 套用後的 settings.fields:', JSON.stringify(settingsStore.settings.fields));
        if (settingsData.custom_css !== undefined) {
          applyCustomCSS(settingsData.custom_css);
        }
        // 延遲重置標記，確保 watch 不會觸發
        setTimeout(() => { isLoadingSettings = false; }, 100);
        return; // 有暫存設定就不再檢查角色卡
      }

      // 2. 新聊天窗：檢查是否有從角色卡匯入的配置（自動套用）
      const cardPreset = settingsStore.settings.presets.find(
        p => p.id.startsWith('__fromCard_') && p.name === characterName
      );
      if (cardPreset) {
        logger.log('[index] 新聊天窗，自動套用角色卡配置:', cardPreset.name);
        isLoadingSettings = true;
        const settingsData = presetDataToSettings(cardPreset.data);
        Object.assign(settingsStore.settings, settingsData);
        if (settingsData.custom_css !== undefined) {
          applyCustomCSS(settingsData.custom_css);
        }
        // 延遲重置標記，確保 watch 不會觸發
        setTimeout(() => { isLoadingSettings = false; }, 100);
        return;
      }

      // 3. 檢查角色卡是否有狀態追蹤設定（首次匯入提示）
      const cardSettings = loadSettingsFromCharacterCard();
      if (cardSettings) {
        // 檢查是否已拒絕過
        const declinedPreset = settingsStore.settings.presets.find(
          p => p.id === `__declined_${characterId}`
        );
        if (declinedPreset) {
          logger.log('[index] 使用者曾拒絕載入此角色卡設定，跳過');
          return;
        }

        logger.log('[index] 偵測到角色卡有狀態追蹤設定:', characterName);

        // 提示使用者是否要載入
        const confirmMessage = `偵測到角色「${characterName}」的角色卡中包含狀態追蹤設定。<br>是否要載入這些設定？<br>（這將覆蓋目前的欄位、Prompt、樣式等設定）`;

        const popup = new Popup(confirmMessage, POPUP_TYPE.CONFIRM);
        const result = await popup.show();

        if (result === POPUP_RESULT.AFFIRMATIVE) {
          // 套用設定
          isLoadingSettings = true;
          Object.assign(settingsStore.settings, cardSettings);

          // 重新應用 CSS
          if (cardSettings.custom_css !== undefined) {
            applyCustomCSS(cardSettings.custom_css);
          }

          // 儲存到 presets，使用 __fromCard_ 前綴標記這是從角色卡來的
          const preset = createPreset(characterName, settingsStore.settings);
          preset.id = `__fromCard_${preset.id}`;
          settingsStore.settings.presets.push(preset);

          // 延遲重置標記
          setTimeout(() => { isLoadingSettings = false; }, 100);

          toastr.success(`已載入角色「${characterName}」的設定`, '成功');
          logger.log('[index] 已從角色卡載入設定並儲存到 presets');
        } else {
          // 用戶拒絕載入，儲存標記避免下次再問
          const declinedMarker = createPreset(characterName, settingsStore.settings);
          declinedMarker.id = `__declined_${characterId}`;
          settingsStore.settings.presets.push(declinedMarker);

          logger.log('[index] 使用者取消載入角色卡設定，已標記');
        }
      }
    }, 500);
  });
});

// 保存當前設定到聊天窗 metadata
function saveChatSettings(): void {
  const context = getContext();
  const chatMetadata = context.chatMetadata as Record<string, any>;
  const chatId = context.chatId;

  logger.log('[index] saveChatSettings 被調用', {
    chatId,
    hasChatMetadata: !!chatMetadata,
    chatMetadataType: typeof chatMetadata,
  });

  // 確保有有效的聊天窗
  if (!chatMetadata || !chatId) {
    logger.log('[index] 沒有有效的聊天窗，跳過保存');
    return;
  }

  const settingsStore = useSettingsStore();

  // 直接 log settings.fields 的完整內容
  logger.log('[index] saveChatSettings - settingsStore.settings.fields:', JSON.stringify(settingsStore.settings.fields));

  const presetData = buildPresetData(settingsStore.settings);

  logger.log('[index] 準備保存的 presetData.fields:', JSON.stringify(presetData.fields));

  chatMetadata[CHAT_SETTINGS_KEY] = presetData;

  // 直接保存，不使用 debounced 版本，避免切換聊天窗時被取消
  context.saveMetadata();

  logger.log('[index] 已保存設定到聊天窗 metadata:', chatId);
  logger.log('[index] 保存後 chatMetadata keys:', Object.keys(chatMetadata));
}

// 匯出給 PanelSettings 使用：取得當前聊天窗是否有暫存設定
export function hasChatSettings(): boolean {
  const context = getContext();
  const chatMetadata = context.chatMetadata as Record<string, any>;
  return !!chatMetadata?.[CHAT_SETTINGS_KEY];
}

// 匯出給 PanelSettings 使用：清除當前聊天窗的暫存設定（重置為角色卡配置）
export function clearChatSettings(): boolean {
  const context = getContext();
  const chatMetadata = context.chatMetadata as Record<string, any>;

  if (!chatMetadata) {
    return false;
  }

  delete chatMetadata[CHAT_SETTINGS_KEY];
  context.saveMetadata();
  logger.log('[index] 已清除聊天窗暫存設定');
  return true;
}
