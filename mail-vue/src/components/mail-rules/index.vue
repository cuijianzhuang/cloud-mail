<template>
  <div class="mail-rules">
    <div v-for="rule in rules" :key="rule.ruleId" class="rule-item">
      <div class="rule-main">
        <span class="rule-name">{{ rule.name || ruleDesc(rule) }}</span>
        <span class="rule-desc">{{ ruleDesc(rule) }} · {{ actionDesc(rule) }}</span>
      </div>
      <div class="rule-ops">
        <el-switch :model-value="rule.enabled === 1" @change="(v) => toggleRule(rule, v)"/>
        <el-button link type="primary" @click="openEdit(rule)">{{$t('edit')}}</el-button>
        <el-button link type="danger" @click="removeRule(rule)">{{$t('delete')}}</el-button>
      </div>
    </div>
    <div v-if="!rules.length" class="rule-empty">{{$t('noRules')}}</div>
    <el-button type="primary" plain @click="openEdit(null)">{{$t('addRule')}}</el-button>

    <el-dialog v-model="dialogShow" :title="$t('mailRule')" width="440">
      <el-form label-width="90px">
        <el-form-item :label="$t('ruleName')">
          <el-input v-model="form.name" :placeholder="$t('optional')"/>
        </el-form-item>
        <el-form-item :label="$t('ruleFrom')">
          <el-input v-model="form.fromMatch" placeholder="example.com"/>
        </el-form-item>
        <el-form-item :label="$t('ruleSubject')">
          <el-input v-model="form.subjectMatch"/>
        </el-form-item>
        <el-form-item :label="$t('ruleContent')">
          <el-input v-model="form.contentMatch"/>
        </el-form-item>
        <el-form-item :label="$t('ruleActions')">
          <div class="rule-actions">
            <el-checkbox v-model="form.actionStar">{{$t('ruleStar')}}</el-checkbox>
            <el-checkbox v-model="form.actionRead">{{$t('ruleRead')}}</el-checkbox>
            <el-checkbox v-model="form.actionDelete">{{$t('ruleDelete')}}</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item :label="$t('ruleForward')">
          <el-input v-model="form.forwardTo" placeholder="a@b.com,c@d.com"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogShow = false">{{$t('cancel')}}</el-button>
        <el-button type="primary" :loading="saving" @click="saveRule">{{$t('save')}}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {onMounted, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {ElMessage, ElMessageBox} from "element-plus";
import {ruleDelete, ruleList, ruleSave} from "@/request/rule.js";

const {t} = useI18n();
const rules = ref([]);
const dialogShow = ref(false);
const saving = ref(false);
const form = reactive({});

function ruleDesc(rule) {
  const parts = [];
  if (rule.fromMatch) parts.push(`${t('ruleFrom')}: ${rule.fromMatch}`);
  if (rule.subjectMatch) parts.push(`${t('ruleSubject')}: ${rule.subjectMatch}`);
  if (rule.contentMatch) parts.push(`${t('ruleContent')}: ${rule.contentMatch}`);
  return parts.join(' / ');
}

function actionDesc(rule) {
  const parts = [];
  if (rule.actionStar) parts.push(t('ruleStar'));
  if (rule.actionRead) parts.push(t('ruleRead'));
  if (rule.actionDelete) parts.push(t('ruleDelete'));
  if (rule.forwardTo) parts.push(`${t('ruleForward')}: ${rule.forwardTo}`);
  return parts.join(' / ');
}

async function load() {
  const data = await ruleList();
  rules.value = data.list || [];
}

function openEdit(rule) {
  Object.assign(form, {
    ruleId: rule?.ruleId || null,
    name: rule?.name || '',
    fromMatch: rule?.fromMatch || '',
    subjectMatch: rule?.subjectMatch || '',
    contentMatch: rule?.contentMatch || '',
    actionStar: !!rule?.actionStar,
    actionRead: !!rule?.actionRead,
    actionDelete: !!rule?.actionDelete,
    forwardTo: rule?.forwardTo || '',
    enabled: rule ? rule.enabled : 1,
  });
  dialogShow.value = true;
}

async function saveRule() {
  saving.value = true;
  try {
    await ruleSave({...form});
    dialogShow.value = false;
    ElMessage.success(t('saveSuccessMsg'));
    await load();
  } finally {
    saving.value = false;
  }
}

async function toggleRule(rule, value) {
  await ruleSave({...rule, enabled: value ? 1 : 0});
  rule.enabled = value ? 1 : 0;
}

async function removeRule(rule) {
  await ElMessageBox.confirm(t('delRuleConfirm'), {type: 'warning'});
  await ruleDelete(rule.ruleId);
  await load();
}

onMounted(load);
</script>

<style scoped>
.mail-rules {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: flex-start;
  width: 100%;
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  max-width: 560px;
}

.rule-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.rule-name {
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rule-desc {
  color: var(--regular-text-color);
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rule-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.rule-empty {
  color: var(--regular-text-color);
}

.rule-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
