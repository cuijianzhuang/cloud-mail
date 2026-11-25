import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const scheduledSend = sqliteTable('scheduled_send', {
	scheduleId: integer('schedule_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	accountId: integer('account_id').default(0).notNull(),
	subject: text('subject').default('').notNull(),
	receiveEmail: text('receive_email').default('[]').notNull(),
	// 完整的发送参数 JSON（含附件 base64），到期时原样交给 emailService.send
	data: text('data').default('{}').notNull(),
	sendAt: text('send_at').notNull(),
	// 0 待发送 1 已发送 2 失败 3 已取消
	status: integer('status').default(0).notNull(),
	error: text('error').default('').notNull(),
	attempts: integer('attempts').default(0).notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export default scheduledSend;
