import settingService from '../service/setting-service';
export default async function initCache(c) {
	await settingService.refresh(c)
}
