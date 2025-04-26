import {useSettingStore} from "@/store/setting.js";

export function cvtR2Url(key) {
    const settingStore = useSettingStore();
    return 'https://' + settingStore.settings.r2Domain + '/' + key
}