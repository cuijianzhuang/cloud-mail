import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const mailRule = sqliteTable('mail_rule', {
	ruleId: integer('rule_id').primaryKey({ autoIncrement: true }),
	userId: integer('user_id').notNull(),
	name: text('name').default('').notNull(),
	// 包含匹配（不区分大小写），空表示不限制；多个条件之间是 AND
	fromMatch: text('from_match').default('').notNull(),
	subjectMatch: text('subject_match').default('').notNull(),
	contentMatch: text('content_match').default('').notNull(),
	actionStar: integer('action_star').default(0).notNull(),
	actionRead: integer('action_read').default(0).notNull(),
	actionDelete: integer('action_delete').default(0).notNull(),
	forwardTo: text('forward_to').default('').notNull(),
	enabled: integer('enabled').default(1).notNull(),
	createTime: text('create_time')
		.notNull()
		.default(sql`CURRENT_TIMESTAMP`),
});

export default mailRule;
