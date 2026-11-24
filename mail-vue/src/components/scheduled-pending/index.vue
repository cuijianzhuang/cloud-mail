<template>
  <div v-if="list.length" class="scheduled-box">
    <div class="scheduled-title">{{$t('scheduledPending')}}</div>
    <div v-for="item in list" :key="item.scheduleId" class="scheduled-item">
      <span class="s-subject">{{ item.subject || '(' + $t('noSubject') + ')' }}</span>
      <span class="s-to">{{ item.receiveEmail.join(', ') }}</span>
      <span class="s-time">{{ item.sendAt }} UTC</span>
      <el-button link type="danger" @click="cancel(item)">{{$t('cancelSchedule')}}</el-button>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";
import {scheduledCancel, scheduledList} from "@/request/scheduled.js";

const list = ref([]);

async function load() {
  const data = await scheduledList();
  list.value = data.list || [];
}

async function cancel(item) {
  await scheduledCancel(item.scheduleId);
  await load();
}

onMounted(load);
</script>

<style scoped>
.scheduled-box {
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scheduled-title {
  font-weight: bold;
  font-size: 13px;
}

.scheduled-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: var(--regular-text-color);
}

.s-subject {
  font-weight: bold;
  color: var(--primary-text-color);
  max-width: 260px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.s-to {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
