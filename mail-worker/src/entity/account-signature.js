import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const accountSignature = sqliteTable('account_signature', {
	accountId: integer('account_id').primaryKey(),
	userId: integer('user_id').notNull(),
	signature: text('signature').default('').notNull(),
	updateTime: text('update_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export default accountSignature;
