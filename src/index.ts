import '@/global.css';
import { initPanel } from '@/panel';
import { initStatusPanel } from '@/statusPanel';
import { initMessageListener } from '@/messageParser';
import { useSettingsStore } from '@/store/settings';
import { useStatusDataStore } from '@/store/statusData';

$(() => {
  initPanel();
  initStatusPanel();

  // 取得 store 實例
  const settingsStore = useSettingsStore();
  const statusDataStore = useStatusDataStore();

  // 初始化訊息監聽器
  initMessageListener(
    (data) => {
      console.log('[ST-StatusTracking] 收到狀態資料:', data);

      // 更新 statusData store
      statusDataStore.data.date = data.date;
      statusDataStore.data.location = data.location;
      statusDataStore.data.weather = data.weather;
      statusDataStore.data.news = data.news;
      statusDataStore.data.customFields = data.customFields;

      console.log('[ST-StatusTracking] statusData 已更新');
    },
    () => settingsStore.settings.fields // 提供取得欄位設定的函數
  );
});
// test
