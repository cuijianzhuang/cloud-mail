<template>
  <emailScroll ref="scroll"
               :allow-star="false"
               :getEmailList="getEmailList"
               :emailDelete="emailDelete"
               :star-add="starAdd"
               :star-cancel="starCancel"
               @jump="jumpContent"
               actionLeft="6px"
               :show-account-icon="false"
               :show-first-loading="false"
               :showStar="false"
               @delete-draft="deleteDraft"
               :type="'draft'"
  >
    <template #name="props">
      <span class="send-email">{{ props.email.receiveEmail?.join(',') || '(' + $t('noRecipient') + ')' }}</span>
    </template>
    <template #subject="props">
      {{ props.email.subject || '(' + $t('noSubject') + ')' }}
    </template>
  </emailScroll>
</template>

<script setup>
import emailScroll from "@/components/email-scroll/index.vue"
import {emailDelete} from "@/request/email.js";
import {starAdd, starCancel} from "@/request/star.js";
import {defineOptions, ref, watch, toRaw} from "vue";
import {useUiStore} from "@/store/ui.js";
import {userDraftStore} from "@/store/draft.js";
import {draftDelete, draftDetail, draftList, draftSave} from "@/request/draft.js";

defineOptions({
  name: 'draft'
})

const draftStore = userDraftStore();
const uiStore = useUiStore();
const scroll = ref({})

watch(() => draftStore.setDraft, async () => {

  const draft = toRaw(draftStore.setDraft)
  const draftId = draft.draftId

  if (!draftId) {
    return;
  }

  if (!draft.content && !draft.subject && !(draft.receiveEmail.length > 0)) {
    await draftDelete([draftId]);
    draftStore.refreshList++
    return;
  }

  await draftSave({
    draftId,
    accountId: draft.accountId,
    subject: draft.subject,
    receiveEmail: draft.receiveEmail,
    data: draft
  });
  draftStore.refreshList++
}, {
  deep: true
})

watch(() => draftStore.refreshList, async () => {
  const {list} = await getEmailList();
    scroll.value.emailList.length = 0
    scroll.value.handleList(list);
    scroll.value.emailList.push(...list)
})

function getEmailList() {
  return draftList();
}

async function deleteDraft(draftIds) {
  await draftDelete(draftIds);
  draftStore.refreshList++
}

async function jumpContent(email) {
  const draft = await draftDetail(email.draftId)
  uiStore.writerRef.openDraft(draft);
}

</script>
<style>
.send-email {
  font-weight: normal;
}
</style>
