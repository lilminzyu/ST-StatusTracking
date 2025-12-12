<template>
  <div class="field-list-wrapper">
    <!-- 分頁切換 -->
    <div class="tabs-container">
      <div
        class="tab-button"
        :class="{ active: activeTab === 'custom' }"
        @click="activeTab = 'custom'"
      >
        {{ t`自訂欄位設定` }}
      </div>
      <div
        class="tab-button"
        :class="{ active: activeTab === 'fixed' }"
        @click="activeTab = 'fixed'"
      >
        {{ t`固定欄位設定` }}
      </div>
    </div>

    <!-- 自訂欄位設定分頁 -->
    <div v-show="activeTab === 'custom'" class="tab-content">
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

        <!-- 按鈕區 -->
        <div class="field-actions">
          <div class="menu_button" @click="addField">
            <i class="fa-solid fa-plus"></i> {{t`新增欄位`}}
          </div>
          <div class="menu_button" @click="resetToDefault">
            <i class="fa-solid fa-rotate-left"></i> {{t`恢復預設`}}
          </div>
        </div>
      </div>
    </div>

    <!-- 固定欄位設定分頁 -->
    <div v-show="activeTab === 'fixed'" class="tab-content">
      <FixedFieldsSettings
        ref="fixedFieldsRef"
        :initial-settings="props.initialSettings"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18nStore } from '@/store/i18n';
import type { Field, Settings } from '@/type/settings';
import Sortable from 'sortablejs';
import FieldItem from './FieldItem.vue';
import FixedFieldsSettings from './FixedFieldsSettings.vue';
import { generateUUID } from '@/utils/uuid';

const { t } = useI18nStore();

// 通過 props 接收初始數據
const props = defineProps<{
  initialSettings: Settings;
  initialFields: Field[];
}>();

const listRef = ref<HTMLElement>();
const fixedFieldsRef = ref<InstanceType<typeof FixedFieldsSettings>>();

// 分頁狀態（預設顯示自訂欄位）
const activeTab = ref<'fixed' | 'custom'>('custom');

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
    id: generateUUID(),
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

// 恢復預設欄位
function resetToDefault() {
  tempFields.value = [
    {
      id: generateUUID(),
      enabled: true,
      name: '好感度',
      description: '<char>目前對<user>的好感度,最低為0最高為100, 純數字',
      order: 0,
      type: 'number' as const,
    },
    {
      id: generateUUID(),
      enabled: true,
      name: '內心話',
      description: '<char>當前內心第一人稱想法, 100字內',
      order: 1,
      type: 'text' as const,
    },
  ];
}

// 返回修改後的數據
function getData() {
  const fixedFieldsData = fixedFieldsRef.value?.getData();

  return {
    fields: klona(tempFields.value),
    fixed_fields_enabled: fixedFieldsData?.fixed_fields_enabled,
    custom_prompt: fixedFieldsData?.custom_prompt,
  };
}

// 暴露 getData 方法給外部呼叫
defineExpose({
  getData,
});
</script>
