import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const draft = sqliteTable('draft', {
	draftId: integer('draft_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	accountId: integer('account_id').default(0).notNull(),
	subject: text('subject').default('').notNull(),
	receiveEmail: text('receive_email').default('[]').notNull(),
	// 完整的写信表单 JSON（含附件 base64），跨设备同步草稿
	data: text('data').default('{}').notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
	updateTime: text('update_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export default draft;
