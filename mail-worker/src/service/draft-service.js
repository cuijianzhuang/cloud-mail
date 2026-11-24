import orm from '../entity/orm';
import { draft } from '../entity/draft';
import BizError from '../error/biz-error';
import { and, desc, eq, inArray } from 'drizzle-orm';
import dayjs from 'dayjs';
import { t } from '../i18n/i18n';

const draftService = {

	// 保存草稿：带 draftId 且属于当前用户时更新，否则新建。返回 draftId。
	async save(c, params, userId) {
		const { draftId, accountId, subject, receiveEmail } = params;
		const data = JSON.stringify(params.data || {});
		const now = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
		const receive = JSON.stringify(receiveEmail || []);

		if (draftId) {
			const exist = await orm(c).select().from(draft)
				.where(and(eq(draft.draftId, Number(draftId)), eq(draft.userId, userId))).get();
			if (exist) {
				await orm(c).update(draft).set({
					accountId: Number(accountId) || 0,
					subject: subject || '',
					receiveEmail: receive,
					data,
					updateTime: now,
				}).where(eq(draft.draftId, exist.draftId)).run();
				return { draftId: exist.draftId };
			}
		}

		const row = await orm(c).insert(draft).values({
			userId,
			accountId: Number(accountId) || 0,
			subject: subject || '',
			receiveEmail: receive,
			data,
			createTime: now,
			updateTime: now,
		}).returning({ draftId: draft.draftId }).get();
		return { draftId: row.draftId };
	},

	// 列表只回摘要字段，正文与附件在 detail 里取，避免列表拉全量 base64
	async list(c, userId) {
		const rows = await orm(c).select({
			draftId: draft.draftId,
			accountId: draft.accountId,
			subject: draft.subject,
			receiveEmail: draft.receiveEmail,
			createTime: draft.createTime,
			updateTime: draft.updateTime,
		}).from(draft).where(eq(draft.userId, userId)).orderBy(desc(draft.updateTime)).all();

		const list = rows.map(row => ({
			...row,
			receiveEmail: JSON.parse(row.receiveEmail || '[]'),
		}));
		return { list };
	},

	async detail(c, params, userId) {
		const row = await orm(c).select().from(draft)
			.where(and(eq(draft.draftId, Number(params.draftId)), eq(draft.userId, userId))).get();
		if (!row) {
			throw new BizError(t('draftNotExist'));
		}
		return { ...JSON.parse(row.data || '{}'), draftId: row.draftId, createTime: row.createTime };
	},

	async delete(c, params, userId) {
		let ids = params.draftIds || params.draftId || [];
		if (!Array.isArray(ids)) ids = [ids];
		ids = ids.map(Number).filter(Boolean);
		if (!ids.length) return;
		await orm(c).delete(draft)
			.where(and(eq(draft.userId, userId), inArray(draft.draftId, ids))).run();
	},

	async removeByUserIds(c, userIds) {
		await orm(c).delete(draft).where(inArray(draft.userId, userIds)).run();
	},
};

export default draftService;
