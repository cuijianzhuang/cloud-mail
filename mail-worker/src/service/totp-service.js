import { eq } from 'drizzle-orm';
import orm from '../entity/orm';
import user from '../entity/user';
import userService from './user-service';
import totpUtils from '../utils/totp-utils';
import KvConst from '../const/kv-const';
import BizError from '../error/biz-error';
import { t } from '../i18n/i18n';

const SETUP_TTL = 600;

const totpService = {

	async status(c, userId) {
		const userRow = await userService.selectById(c, userId);
		return { enabled: userRow.totpEnabled === 1 };
	},

	// 开始绑定：生成密钥暂存 KV（10 分钟内完成验证），返回密钥与 otpauth 地址供前端出二维码
	async setup(c, userId) {
		const userRow = await userService.selectById(c, userId);
		if (userRow.totpEnabled === 1) {
			throw new BizError(t('totpAlreadyEnabled'));
		}
		const secret = totpUtils.generateSecret();
		await c.env.kv.put(KvConst.TOTP_SETUP + userId, secret, { expirationTtl: SETUP_TTL });
		const issuer = 'CloudMail';
		const otpauthUrl = `otpauth://totp/${issuer}:${encodeURIComponent(userRow.email)}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
		return { secret, otpauthUrl };
	},

	// 确认绑定：校验动态码后落库，同时生成 8 个一次性恢复码（明文只返回这一次，库里只存哈希）
	async enable(c, userId, code) {
		const secret = await c.env.kv.get(KvConst.TOTP_SETUP + userId);
		if (!secret) {
			throw new BizError(t('totpSetupExpired'));
		}
		if (!await totpUtils.verify(secret, code)) {
			throw new BizError(t('totpCodeInvalid'));
		}
		const codes = totpUtils.generateRecoveryCodes();
		const hashes = [];
		for (const item of codes) {
			hashes.push(await totpUtils.hashCode(item));
		}
		await orm(c).update(user).set({
			totpSecret: secret,
			totpEnabled: 1,
			totpRecovery: JSON.stringify(hashes),
		}).where(eq(user.userId, userId)).run();
		await c.env.kv.delete(KvConst.TOTP_SETUP + userId);
		return { recoveryCodes: codes };
	},

	async disable(c, userId, code) {
		const userRow = await userService.selectById(c, userId);
		if (userRow.totpEnabled !== 1) {
			return;
		}
		if (!await this.verifyUserCode(c, userRow, code)) {
			throw new BizError(t('totpCodeInvalid'));
		}
		await orm(c).update(user).set({
			totpSecret: '',
			totpEnabled: 0,
			totpRecovery: '',
		}).where(eq(user.userId, userId)).run();
	},

	// 校验用户输入：先动态码，未命中再按恢复码处理（恢复码一次性，命中即从库中移除）
	async verifyUserCode(c, userRow, code) {
		if (!code || userRow.totpEnabled !== 1) {
			return false;
		}
		if (await totpUtils.verify(userRow.totpSecret, code)) {
			return true;
		}
		let hashes = [];
		try {
			hashes = JSON.parse(userRow.totpRecovery || '[]');
		} catch {
			hashes = [];
		}
		if (!hashes.length) {
			return false;
		}
		const hash = await totpUtils.hashCode(code);
		const index = hashes.indexOf(hash);
		if (index === -1) {
			return false;
		}
		hashes.splice(index, 1);
		await orm(c).update(user).set({ totpRecovery: JSON.stringify(hashes) }).where(eq(user.userId, userRow.userId)).run();
		return true;
	},
};

export default totpService;
