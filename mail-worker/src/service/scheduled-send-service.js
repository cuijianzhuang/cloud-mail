import orm from '../entity/orm';
import { scheduledSend } from '../entity/scheduled-send';
import BizError from '../error/biz-error';
import { and, asc, eq, inArray, lte } from 'drizzle-orm';
import dayjs from 'dayjs';
import emailService from './email-service';
import { t } from '../i18n/i18n';

const STATUS = { PENDING: 0, SENT: 1, FAILED: 2, CANCELLED: 3 };

const scheduledSendService = {

	async create(c, params, userId) {
		const sendAt = dayjs(params.sendAt);
		if (!sendAt.isValid() || sendAt.utc().isBefore(dayjs().utc())) {
			throw new BizError(t('scheduleTimeInvalid'));
		}
		const data = params.data || {};
		const row = await orm(c).insert(scheduledSend).values({
			userId,
			accountId: Number(data.accountId) || 0,
			subject: data.subject || '',
			receiveEmail: JSON.stringify(data.receiveEmail || []),
			data: JSON.stringify(data),
			sendAt: sendAt.utc().format('YYYY-MM-DD HH:mm:ss'),
			status: STATUS.PENDING,
		}).returning({ scheduleId: scheduledSend.scheduleId }).get();
		return { scheduleId: row.scheduleId };
	},

	async list(c, userId) {
		const rows = await orm(c).select({
			scheduleId: scheduledSend.scheduleId,
			accountId: scheduledSend.accountId,
			subject: scheduledSend.subject,
			receiveEmail: scheduledSend.receiveEmail,
			sendAt: scheduledSend.sendAt,
			status: scheduledSend.status,
			error: scheduledSend.error,
			createTime: scheduledSend.createTime,
		}).from(scheduledSend)
			.where(and(eq(scheduledSend.userId, userId), eq(scheduledSend.status, STATUS.PENDING)))
			.orderBy(asc(scheduledSend.sendAt)).all();
		const list = rows.map(row => ({ ...row, receiveEmail: JSON.parse(row.receiveEmail || '[]') }));
		return { list };
	},

	async cancel(c, params, userId) {
		await orm(c).update(scheduledSend).set({ status: STATUS.CANCELLED })
			.where(and(
				eq(scheduledSend.userId, userId),
				eq(scheduledSend.scheduleId, Number(params.scheduleId)),
				eq(scheduledSend.status, STATUS.PENDING))).run();
	},

	async removeByUserIds(c, userIds) {
		await orm(c).delete(scheduledSend).where(inArray(scheduledSend.userId, userIds)).run();
	},

	// cron 调用：把所有到期且待发送的邮件真正发出去
	async dispatch(c) {
		const now = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');
		const rows = await orm(c).select().from(scheduledSend)
			.where(and(eq(scheduledSend.status, STATUS.PENDING), lte(scheduledSend.sendAt, now)))
			.orderBy(asc(scheduledSend.sendAt)).limit(50).all();

		for (const row of rows) {
			try {
				await emailService.send(c, JSON.parse(row.data || '{}'), row.userId);
				await orm(c).update(scheduledSend).set({ status: STATUS.SENT, error: '' })
					.where(eq(scheduledSend.scheduleId, row.scheduleId)).run();
			} catch (e) {
				console.error('定时发送失败: ', e);
				await orm(c).update(scheduledSend).set({ status: STATUS.FAILED, error: String(e?.message || e).slice(0, 500) })
					.where(eq(scheduledSend.scheduleId, row.scheduleId)).run();
			}
		}
		return rows.length;
	},
};

export default scheduledSendService;
