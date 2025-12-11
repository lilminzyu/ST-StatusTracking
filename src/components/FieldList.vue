<template>
  <div class="field-list-container">
    <!-- 欄位列表 -->
    <div ref="listRef" class="field-list">
      <FieldItem
        v-for="field in sortedFields"
        :key="field.id"
        :field="field"
        :data-id="field.id"
        @update:enabled="updateField(field.id, 'enabled', $event)"
        @update:name="updateField(field.id, 'name', $event)"
        @update:description="updateField(field.id, 'description', $event)"
        @update:type="updateField(field.id, 'type', $event)"
        @delete="deleteField(field.id)"
      />
    </div>

    <!-- 新增按鈕 -->
    <div class="menu_button" @click="addField">
      <i class="fa-solid fa-plus"></i> {{t`新增欄位`}}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Field } from '@/type/settings';
import Sortable from 'sortablejs';
import FieldItem from './FieldItem.vue';
import { useI18nStore } from '@/store/i18n';

const { t } = useI18nStore();

// 通過 props 接收初始數據
const props = defineProps<{
  initialFields: Field[];
}>();

const listRef = ref<HTMLElement>();

// 臨時狀態
const tempFields = ref<Field[]>([]);

// 初始化
onMounted(() => {
  // 從 props 複製數據
  tempFields.value = klona(props.initialFields);
  
  // 初始化拖曳
  if (!listRef.value) return;
  
  Sortable.create(listRef.value, {
    animation: 150,
    handle: '.drag-handle',
    onEnd: (evt) => {
      const oldIndex = evt.oldIndex!;
      const newIndex = evt.newIndex!;
      
      const movedField = tempFields.value.splice(oldIndex, 1)[0];
      tempFields.value.splice(newIndex, 0, movedField);
      tempFields.value.forEach((f, i) => f.order = i);
    },
  });
});

// 排序
const sortedFields = computed(() => {
  return [...tempFields.value].sort((a, b) => a.order - b.order);
});

// 新增
function addField() {
  const newField: Field = {
    id: crypto.randomUUID(),
    enabled: true,
    name: '',
    description: '',
    order: tempFields.value.length,
    type: 'number',
  };
  tempFields.value.push(newField);
}

// 更新
function updateField(id: string, key: keyof Field, value: any) {
  const field = tempFields.value.find(f => f.id === id);
  if (field) {
    (field as any)[key] = value;
  }
}

// 刪除
function deleteField(id: string) {
  const index = tempFields.value.findIndex(f => f.id === id);
  if (index !== -1) {
    tempFields.value.splice(index, 1);
    tempFields.value.forEach((f, i) => f.order = i);
  }
}

// 返回修改後的數據
function getData() {
  return klona(tempFields.value);
}

// 暴露 getData 方法給外部呼叫
defineExpose({
  getData,
});
</script>

<style scoped>
.field-list-container {
  padding: 10px;
}

.field-list {
  margin-bottom: 10px;
}

.menu_button {
  width: 100%;
  text-align: center;
}
</style>