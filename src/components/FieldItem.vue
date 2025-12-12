<template>
  <div class="field-item">
    <!-- 拖曳 handle -->
    <div class="drag-handle">
      <i class="fa-solid fa-grip-vertical"></i>
    </div>

    <!-- checkbox -->
    <input 
      type="checkbox" 
      :checked="field.enabled"
      @change="$emit('update:enabled', ($event.target as HTMLInputElement).checked)"
    />

    <!-- 欄位名稱 -->
    <input
      type="text"
      class="text_pole field_key"
      :value="field.name"
      :placeholder="t`欄位名稱`"
      @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
    />

    <!-- 給AI的欄位說明 -->
    <input
      type="text"
      class="text_pole field_value"
      :value="field.description"
      :placeholder="t`給AI的欄位說明`"
      @input="$emit('update:description', ($event.target as HTMLInputElement).value)"
    />
    <!-- 類型選擇 -->
    <label>
      <input
        type="radio"
        :checked="field.type === 'number'"
        @change="$emit('update:type', 'number')"
      />
      {{ t`數字` }}
    </label>
    <label>
      <input
        type="radio"
        :checked="field.type === 'text'"
        @change="$emit('update:type', 'text')"
      />
      {{ t`文字` }}
    </label>
    <!-- 刪除按鈕 -->
    <div class="menu_button" @click="$emit('delete')">
      <i class="fa-solid fa-trash"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18nStore } from '@/store/i18n';
import type { Field } from '@/type/settings';

const { t } = useI18nStore();

// Props（接收資料）
defineProps<{
  field: Field;
}>();

// Emits（發送事件）
defineEmits<{
  'update:enabled': [value: boolean];
  'update:name': [value: string];
  'update:description': [value: string];
  'update:type': [value: 'number' | 'text'];
  'delete': [];
}>();
</script>