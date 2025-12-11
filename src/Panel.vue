<template>
  <div class="status-tracking-settings">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>{{ t`狀態追蹤` }}</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        
        <!-- 開啟擴充 -->
        <div class="status-tracking_block flex-container">
          <input 
            id="status-tracking_enabled" 
            v-model="settings.panel_enabled" 
            type="checkbox" 
          />
          <label for="status-tracking_enabled">{{ t`啟用狀態面板` }}</label>
        </div>

        <hr class="sysHR" />

        <!-- 連結 -->
        <div class="status-tracking_block flex-container">
          <a href="https://github.com/lilminzyu/ST-StatusTracking" target="_blank" class="menu_button">
            <i class="fa-brands fa-github"></i> GitHub
          </a>
          <a href="https://discord.gg/你的discord" target="_blank" class="menu_button">
            <i class="fa-brands fa-discord"></i> Discord
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18nStore } from '@/store/i18n';
import { useSettingsStore } from '@/store/settings';

const { settings } = storeToRefs(useSettingsStore());
const { t } = useI18nStore();
</script>

<style scoped>
.status-tracking_block {
  margin-bottom: 10px;
}

.status-tracking_block a.menu_button {
  text-align: center;
  text-decoration: none;
  display: block;
}
</style>