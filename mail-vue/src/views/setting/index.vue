<template>
  <div class="settings-page">
    <el-scrollbar height="100%">
  <div class="box">
    <div class="container">
      <div class="title">{{$t('profile')}}</div>
      <div class="item setting-row">
        <div>{{$t('username')}}</div>
        <div>
          <span v-if="setNameShow" class="edit-name-input">
            <el-input v-model="accountName"  ></el-input>
            <span class="edit-name" @click="setName">
             {{$t('save')}}
            </span>
          </span>
          <span v-else class="user-name">
            <span >{{ userStore.user.name }}</span>
            <span class="edit-name" @click="showSetName">
             {{$t('change')}}
            </span>
          </span>
        </div>
      </div>
      <div class="item setting-row">
        <div>{{$t('emailAccount')}}</div>
        <div>{{ userStore.user.email }}</div>
      </div>
      <div class="item setting-row">
        <div>{{$t('password')}}</div>
        <div>
          <el-button type="primary" @click="pwdShow = true">{{$t('changePwdBtn')}}</el-button>
        </div>
      </div>
      <div class="item setting-row">
        <div>{{$t('totpTitle')}}</div>
        <div>
          <el-button v-if="totpEnabled" @click="totpDisableShow = true">{{$t('totpDisableBtn')}}</el-button>
          <el-button v-else type="primary" @click="startTotpSetup">{{$t('totpEnableBtn')}}</el-button>
          <span class="totp-state">{{ totpEnabled ? $t('totpOn') : $t('totpOff') }}</span>
        </div>
      </div>
    </div>
    <div class="oauth-bind" v-if="oauthPlatformList.length > 0">
      <div class="title">{{$t('accountBind')}}</div>
      <div class="oauth-item" v-for="item in oauthPlatformList" :key="item.key">
        <div class="oauth-name">
          <el-avatar v-if="item.iconType === 'image'" :src="item.icon" :size="20"/>
          <Icon v-else :icon="item.icon" width="20" height="20"/>
          <span>{{ item.label }}</span>
        </div>
        <div class="oauth-opt">
          <span class="oauth-username">{{ item.bindRow ? (item.bindRow.username || item.bindRow.name) : $t('notBind') }}</span>
          <el-button v-if="item.bindRow" @click="unbindConfirm(item)">{{$t('unbind')}}</el-button>
          <el-button v-else type="primary" @click="bindOauth(item)">{{$t('bind')}}</el-button>
        </div>
      </div>
    </div>
    <div class="language">
      <div class="title">{{$t('language')}}</div>
      <div class="language-row setting-row">
        <div>{{$t('preferredLanguage')}}</div>
        <el-select
            :model-value="langSelect"
            class="language-select"
            placeholder="Select"
            @change="changeLang"
        >
          <el-option label="中文" value="zh" @pointerdown.prevent.stop="changeLang('zh')"/>
          <el-option label="English" value="en" @pointerdown.prevent.stop="changeLang('en')"/>
        </el-select>
      </div>
    </div>
    <div class="preference-item">
      <div class="title" id="theme-label">{{$t('themeStyle')}}</div>
      <ThemeSelector/>
    </div>
    <div class="preference-item">
      <div class="title">{{$t('noticeTitle')}}</div>
      <div class="language-row setting-row">
        <div>{{$t('noticeInfo')}}</div>
        <div>
          <el-button @click="uiStore.showNotice(true)">{{$t('viewNotice')}}</el-button>
        </div>
      </div>
    </div>
    <div class="preference-item">
      <div class="title">{{$t('mailRule')}}</div>
      <MailRules/>
    </div>
    <div class="del-email" v-perm="'my:delete'">
      <div class="title">{{$t('deleteUser')}}</div>
      <div style="color: var(--regular-text-color);">
        {{$t('delAccountMsg')}}
      </div>
      <div>
        <el-button type="primary" @click="deleteConfirm">{{$t('deleteUserBtn')}}</el-button>
      </div>
    </div>
    <el-dialog v-model="pwdShow" :title="$t('changePassword')" width="340">
      <div class="update-pwd">
        <el-input type="password" :placeholder="$t('newPassword')" v-model="form.password" autocomplete="off" @keyup.enter="submitPwd"/>
        <el-input type="password" :placeholder="$t('confirmPassword')" v-model="form.newPwd" autocomplete="off" @keyup.enter="submitPwd"/>
        <el-button type="primary" :loading="setPwdLoading" @click="submitPwd">{{$t('save')}}</el-button>
      </div>
    </el-dialog>
    <el-dialog v-model="totpSetupShow" :title="$t('totpSetupTitle')" width="360">
      <div class="update-pwd">
        <div class="totp-qr"><img v-if="totpQr" :src="totpQr" alt=""/></div>
        <div class="totp-secret">{{ $t('totpSecretLabel') }}：<span>{{ totpSecret }}</span></div>
        <div class="totp-tip">{{ $t('totpScanHint') }}</div>
        <el-input v-model="totpCode" :placeholder="$t('totpCodePlaceholder')" autocomplete="off" @keyup.enter="submitTotpEnable"/>
        <el-button type="primary" :loading="totpLoading" @click="submitTotpEnable">{{$t('totpConfirmEnable')}}</el-button>
      </div>
    </el-dialog>
    <el-dialog v-model="totpRecoveryShow" :title="$t('totpRecoveryTitle')" width="360" :close-on-click-modal="false" :show-close="false">
      <div class="update-pwd">
        <div class="totp-tip">{{ $t('totpRecoveryDesc') }}</div>
        <div class="totp-codes">
          <span v-for="code in totpRecoveryCodes" :key="code">{{ code }}</span>
        </div>
        <el-button type="primary" @click="totpRecoveryShow = false">{{$t('totpRecoverySaved')}}</el-button>
      </div>
    </el-dialog>
    <el-dialog v-model="totpDisableShow" :title="$t('totpDisableTitle')" width="340">
      <div class="update-pwd">
        <div class="totp-tip">{{ $t('totpDisableHint') }}</div>
        <el-input v-model="totpDisableCode" :placeholder="$t('totpCodePlaceholder')" autocomplete="off" @keyup.enter="submitTotpDisable"/>
        <el-button type="primary" :loading="totpLoading" @click="submitTotpDisable">{{$t('confirm')}}</el-button>
      </div>
    </el-dialog>
  </div>
    </el-scrollbar>
  </div>
</template>
<script setup>
import {reactive, ref, computed, onMounted, defineOptions} from 'vue'
import {resetPassword, userDelete, totpStatus, totpSetup, totpEnable, totpDisable} from "@/request/my.js";
import QRCode from "qrcode";
import {useUserStore} from "@/store/user.js";
import router from "@/router/index.js";
import {accountSetName} from "@/request/account.js";
import {useAccountStore} from "@/store/account.js";
import {useI18n} from "vue-i18n";
import {useSettingStore} from "@/store/setting.js";
import {Icon} from "@iconify/vue";
import {oauthBindList, oauthUnbind} from "@/request/ouath.js";
import {oauthPlatforms, toOauthAuthorize} from "@/utils/oauth-utils.js";
import {useUiStore} from "@/store/ui.js";
import ThemeSelector from "@/components/theme-selector/index.vue";
import MailRules from "@/components/mail-rules/index.vue";

const { t } = useI18n()
const accountStore = useAccountStore()
const settingStore = useSettingStore()
const uiStore = useUiStore()
const userStore = useUserStore();
const setPwdLoading = ref(false)
const setNameShow = ref(false)
const accountName = ref(null)
const langSelect = ref(settingStore.lang)

defineOptions({
  name: 'setting'
})

function showSetName() {
  accountName.value = userStore.user.name
  setNameShow.value = true
}

function setName() {

  if (!accountName.value) {
    ElMessage({
      message: t('emptyUserNameMsg'),
      type: 'error',
      plain: true,
    })
    return;
  }

  setNameShow.value = false
  let name = accountName.value

  if (name === userStore.user.name) {
    return
  }

  userStore.user.name = accountName.value

  accountSetName(userStore.user.account.accountId,name).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })

    accountStore.changeUserAccountName = name

  }).catch(() => {
    userStore.user.name = name
  })
}

function changeLang(lang) {
  let setting = {}
  try {
    setting = JSON.parse(localStorage.getItem('setting') || '{}')
  } catch (e) {
    setting = {}
  }
  localStorage.setItem('setting', JSON.stringify({...setting, lang}))
  window.location.reload()
}

const pwdShow = ref(false)
const form = reactive({
  password: '',
  newPwd: '',
})

const deleteConfirm = () => {
  ElMessageBox.confirm(t('delAccountConfirm'), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    userDelete().then(() => {
      localStorage.removeItem('token');
      router.replace('/login');
      ElMessage({
        message: t('delSuccessMsg'),
        type: 'success',
        plain: true,
      })
    })
  })
}


const bindList = ref([])

//只显示管理员已开启的第三方平台
const oauthPlatformList = computed(() => {
  return oauthPlatforms
      .filter(item => settingStore.settings[item.key + 'Switch'] === 0)
      .map(item => ({...item, bindRow: bindList.value.find(row => row.platform === item.key)}))
})

onMounted(() => {
  loadBindList()
  loadTotpStatus()
})

const totpEnabled = ref(false)
const totpSetupShow = ref(false)
const totpDisableShow = ref(false)
const totpRecoveryShow = ref(false)
const totpSecret = ref('')
const totpQr = ref('')
const totpCode = ref('')
const totpDisableCode = ref('')
const totpRecoveryCodes = ref([])
const totpLoading = ref(false)

function loadTotpStatus() {
  totpStatus().then(data => {
    totpEnabled.value = !!data.enabled
  }).catch(() => {})
}

async function startTotpSetup() {
  try {
    const data = await totpSetup()
    totpSecret.value = data.secret
    totpQr.value = await QRCode.toDataURL(data.otpauthUrl, {width: 200, margin: 1})
    totpCode.value = ''
    totpSetupShow.value = true
  } catch {}
}

function submitTotpEnable() {
  if (totpLoading.value || !totpCode.value.trim()) return
  totpLoading.value = true
  totpEnable(totpCode.value.trim()).then(data => {
    totpSetupShow.value = false
    totpEnabled.value = true
    totpRecoveryCodes.value = data.recoveryCodes || []
    totpRecoveryShow.value = true
    ElMessage({
      message: t('totpEnableSuccess'),
      type: 'success',
      plain: true,
    })
  }).catch(() => {}).finally(() => {
    totpLoading.value = false
  })
}

function submitTotpDisable() {
  if (totpLoading.value || !totpDisableCode.value.trim()) return
  totpLoading.value = true
  totpDisable(totpDisableCode.value.trim()).then(() => {
    totpDisableShow.value = false
    totpDisableCode.value = ''
    totpEnabled.value = false
    ElMessage({
      message: t('totpDisableSuccess'),
      type: 'success',
      plain: true,
    })
  }).catch(() => {}).finally(() => {
    totpLoading.value = false
  })
}

function loadBindList() {
  oauthBindList().then(list => {
    bindList.value = list
  })
}

function bindOauth(item) {
  toOauthAuthorize(item.key, settingStore.settings[item.key + 'ClientId'], true)
}

function unbindConfirm(item) {
  ElMessageBox.confirm(t('unbindConfirm', {msg: item.label}), {
    confirmButtonText: t('confirm'),
    cancelButtonText: t('cancel'),
    type: 'warning'
  }).then(() => {
    oauthUnbind(item.key).then(() => {
      ElMessage({
        message: t('unbindSuccessMsg'),
        type: 'success',
        plain: true,
      })
      loadBindList()
    })
  })
}

function submitPwd() {

  if (setPwdLoading.value) return

  if (!form.password) {
    ElMessage({
      message: t('emptyPwdMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password.length < 6) {
    ElMessage({
      message: t('pwdLengthMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  if (form.password !== form.newPwd) {
    ElMessage({
      message: t('confirmPwdFailMsg'),
      type: 'error',
      plain: true,
    })
    return
  }

  setPwdLoading.value = true
  resetPassword(form.password).then(() => {
    ElMessage({
      message: t('saveSuccessMsg'),
      type: 'success',
      plain: true,
    })
    pwdShow.value = false
    setPwdLoading.value = false
    form.password = ''
    form.newPwd = ''
  }).catch(() => {
    setPwdLoading.value = false
  })

}

</script>
<style scoped lang="scss">
.settings-page {
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.box {
  padding: 40px 40px;

  @media (max-width: 767px) {
    padding: 30px 30px;
  }

  .update-pwd {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .totp-state {
    margin-left: 10px;
    color: var(--regular-text-color);
  }

  .totp-qr {
    text-align: center;

    img {
      width: 200px;
      height: 200px;
    }
  }

  .totp-secret {
    font-size: 13px;
    word-break: break-all;

    span {
      font-family: monospace;
      font-weight: bold;
    }
  }

  .totp-tip {
    font-size: 13px;
    color: var(--regular-text-color);
    line-height: 1.5;
  }

  .totp-codes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    font-family: monospace;
    font-size: 15px;
    text-align: center;
    background: var(--el-fill-color-light);
    border-radius: 6px;
    padding: 12px;
  }

  .title {
    font-size: 18px;
    font-weight: bold;
  }

  .container {
    font-size: 14px;
    display: grid;
    gap: 20px;
    margin-bottom: 40px;

    .item {
      position: relative;
      .user-name {
        display: grid;
        grid-template-columns: minmax(0, auto) max-content;
        justify-content: start;
        align-items: center;
        span:first-child {
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }

      .edit-name-input {
        position: absolute;
        bottom: -6px;
        .el-input {
          width: min(200px,calc(100vw - 222px));
        }
      }

      .edit-name {
        color: #4dabff;
        padding-left: 10px;
        white-space: nowrap;
        cursor: pointer;
      }

    }
  }

  .oauth-bind {
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 40px;

    .oauth-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-width: 400px;
      gap: 20px;

      .oauth-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
      }

      .oauth-opt {
        display: flex;
        align-items: center;
        gap: 12px;
        overflow: hidden;
      }

      .oauth-username {
        color: var(--regular-text-color);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }
  }

  .preference-item,
  .language {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 40px;
    align-items: flex-start;

  }

  .setting-row {
    width: 100%;
    display: grid;
    grid-template-columns: 120px 220px;
    align-items: center;
    column-gap: 110px;
    font-size: 14px;

    > div:first-child {
      font-weight: bold;
      min-width: 0;
      text-align: left;
    }

    > div:last-child {
      min-width: 0;
      overflow: hidden;
      text-align: left;
    }

    @media (max-width: 767px) {
      grid-template-columns: 120px minmax(0, 1fr);
      column-gap: 24px;
    }
  }

  .language-select {
    width: 110px;
    max-width: 100%;
  }

  .del-email {
    font-size: 14px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}
</style>
