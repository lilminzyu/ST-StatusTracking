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

  return { data };
});