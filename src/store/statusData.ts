export const useStatusDataStore = defineStore('statusData', () => {
  const data = ref({
    date: '',
    location: '',
    weather: '',
    news: {
      title: '',
      content: '',
    },
    customFields: {} as Record<string, number | string>
  });

  // 清空所有狀態資料
  function clearData() {
    data.value = {
      date: '',
      location: '',
      weather: '',
      news: {
        title: '',
        content: '',
      },
      customFields: {}
    };
  }

  return { data, clearData };
});