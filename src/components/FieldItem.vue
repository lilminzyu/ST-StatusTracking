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
      class="text_pole"
      :value="field.name"
      placeholder="欄位名稱"
      @input="$emit('update:name', ($event.target as HTMLInputElement).value)"
    />

    <!-- 欄位說明 -->
    <input
      type="text"
      class="text_pole"
      :value="field.description"
      placeholder="欄位說明"
      @input="$emit('update:description', ($event.target as HTMLInputElement).value)"
    />

    <!-- 刪除按鈕 -->
    <div class="menu_button" @click="$emit('delete')">
      <i class="fa-solid fa-trash"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Field } from '@/type/settings';

// Props（接收資料）
defineProps<{
  field: Field;
}>();

// Emits（發送事件）
defineEmits<{
  'update:enabled': [value: boolean];
  'update:name': [value: string];
  'update:description': [value: string];
  'delete': [];
}>();
</script>

<style scoped>
.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 5px;
  margin-bottom: 5px;
}

.drag-handle {
  cursor: grab;
  color: var(--SmartThemeBodyColor);
  padding: 5px;
}

.drag-handle:active {
  cursor: grabbing;
}

.field-item input[type="checkbox"] {
  margin: 0;
}

.field-item input.text_pole {
  flex: 1;
}

.field-item .menu_button {
  padding: 5px 10px;
  cursor: pointer;
}
</style>