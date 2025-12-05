import StatusDisplay from '@/components/StatusDisplay.vue';
import { createPinia } from 'pinia';
import { App, createApp } from 'vue';
import 'vue-final-modal/style.css';

let app: ReturnType<typeof createApp> | null = null;

// i18n 插件
const i18n = {
  install: (app: App) => {
    app.config.globalProperties.t = t;
  },
};

export function initStatusPanel() {
  // 如果已經初始化過，就不再重複
  if (app) return;

  const RootComponent = {
    setup() {
      return () => h('div', [
        h(StatusDisplay)
      ]);
    }
  };

  // 創建掛載點
  const $container = $('<div id="status-tracking-panel">').appendTo('body');

  // 創建 Vue app
  app = createApp(RootComponent);  

  // 使用 pinia
  const pinia = createPinia();
  app.use(pinia);

  app.use(i18n);

  // 掛載
  app.mount($container[0]);
}