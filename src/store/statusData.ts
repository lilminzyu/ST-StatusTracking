// 數字欄位的值類型：包含數值和顯示文字
export type NumberFieldValue = {
  value: number;      // 用於進度條計算
  display: string;    // 用於顯示（保留 % 等符號）
};

export const useStatusDataStore = defineStore('statusData', () => {
  const data = ref({
    date: '',
    location: '',
    weather: '',
    news: {
      type: '',
      title: '',
      content: '',
    },
    notes: '',
    customFields: {} as Record<string, number | string | NumberFieldValue>
  });

  // 清空所有狀態資料
  function clearData() {
    data.value = {
      date: '',
      location: '',
      weather: '',
      news: {
        type: '',
        title: '',
        content: '',
      },
      notes: '',
      customFields: {}
    };
  }

  return { data, clearData };
});