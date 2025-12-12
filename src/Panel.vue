<template>
  <div class="status-tracking-settings">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>{{ t`狀態追蹤` }}</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <!-- 開關區域 -->
        <div class="toggles-container">
          <div class="toggle-item">
            <input
              id="status-tracking_enabled"
              v-model="settings.panel_enabled"
              type="checkbox"
            />
            <label for="status-tracking_enabled">{{ t`啟用狀態面板` }}</label>
          </div>

          <div class="toggle-item">
            <input
              id="status-tracking_debug"
              v-model="settings.debug_mode"
              type="checkbox"
            />
            <label for="status-tracking_debug">{{ t`Debug 模式` }}</label>
          </div>
        </div>

        <hr class="sysHR" />

        <!-- 連結區域 -->
        <div class="links-container">
          <a href="https://github.com/lilminzyu" target="_blank" class="menu_button link-button">
            <i class="fa-brands fa-github"></i> GitHub
          </a>
          <a href="https://discord.gg/NFmesS7ubb" target="_blank" class="menu_button link-button">
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