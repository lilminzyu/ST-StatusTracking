import Panel from '@/Panel.vue';
import { pinia } from '@/store/pinia';
import { App, createApp } from 'vue';

const app = createApp(Panel);

app.use(pinia);

declare module 'vue' {
  interface ComponentCustomProperties {
    t: typeof t;
  }
}
const i18n = {
  install: (app: App) => {
    app.config.globalProperties.t = t;
  },
};
app.use(i18n);

export function initPanel() {
  const $app = $('<div id="status_tracking">').appendTo('#extensions_settings2');
  app.mount($app[0]);
}
