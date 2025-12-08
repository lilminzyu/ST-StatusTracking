export const useStatusDataStore = defineStore('statusData', () => {
  const data = ref({
    // 暫時放假資料
    date: '2024年10月17日．周四．17:45',      
    location: '九尾酒吧三楼．沈之然的起居室',  
    weather: '夜間微涼',   
    news: {
      title: '吸血鬼與妖怪是否具有生殖隔離? 專家表示仍需更多研究',   
      content: '研究人員發現，吸血鬼與妖怪之間可能存在生殖隔離，這意味著兩者無法自然交配產生後代。這一發現對於理解超自然生物的生物學特性具有重要意義，但專家們強調，仍需進一步的研究來確認這一結論。',  
    },
    customFields: {} as Record<string, number | string>
  });

  return { data };
});