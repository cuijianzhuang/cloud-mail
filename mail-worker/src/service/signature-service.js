import orm from '../entity/orm';
import { accountSignature } from '../entity/account-signature';
import account from '../entity/account';
import { and, eq, inArray } from 'drizzle-orm';
import dayjs from 'dayjs';

const signatureService = {

	async get(c, params, userId) {
		const row = await orm(c).select().from(accountSignature)
			.where(and(eq(accountSignature.accountId, Number(params.accountId)), eq(accountSignature.userId, userId))).get();
		return { signature: row?.signature || '' };
	},

	async save(c, params, userId) {
		const accountId = Number(params.accountId);
		const accountRow = await orm(c).select().from(account)
			.where(and(eq(account.accountId, accountId), eq(account.userId, userId))).get();
		if (!accountRow) {
			return { signature: '' };
		}
		const signature = String(params.signature || '').slice(0, 2000);
		const now = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
		await orm(c).insert(accountSignature)
			.values({ accountId, userId, signature, updateTime: now })
			.onConflictDoUpdate({ target: accountSignature.accountId, set: { signature, updateTime: now } })
			.run();
		return { signature };
	},

	// 发信时按账号取签名（内部调用，已确保 accountId 属于发信流程）
	async getByAccountId(c, accountId) {
		if (!accountId) return '';
		const row = await orm(c).select().from(accountSignature)
			.where(eq(accountSignature.accountId, Number(accountId))).get();
		return row?.signature || '';
	},

	async removeByUserIds(c, userIds) {
		await orm(c).delete(accountSignature).where(inArray(accountSignature.userId, userIds)).run();
	},
};

export default signatureService;
