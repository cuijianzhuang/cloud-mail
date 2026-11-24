import orm from '../entity/orm';
import { mailRule } from '../entity/mail-rule';
import email from '../entity/email';
import { star } from '../entity/star';
import BizError from '../error/biz-error';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { emailConst, isDel } from '../const/entity-const';
import { t } from '../i18n/i18n';

const ruleService = {

	async list(c, userId) {
		const list = await orm(c).select().from(mailRule)
			.where(eq(mailRule.userId, userId)).orderBy(asc(mailRule.ruleId)).all();
		return { list };
	},

	async save(c, params, userId) {
		const data = {
			name: params.name || '',
			fromMatch: (params.fromMatch || '').trim(),
			subjectMatch: (params.subjectMatch || '').trim(),
			contentMatch: (params.contentMatch || '').trim(),
			actionStar: params.actionStar ? 1 : 0,
			actionRead: params.actionRead ? 1 : 0,
			actionDelete: params.actionDelete ? 1 : 0,
			forwardTo: (params.forwardTo || '').trim(),
			enabled: params.enabled === 0 ? 0 : 1,
		};

		if (!data.fromMatch && !data.subjectMatch && !data.contentMatch) {
			throw new BizError(t('ruleMatchRequired'));
		}
		if (!data.actionStar && !data.actionRead && !data.actionDelete && !data.forwardTo) {
			throw new BizError(t('ruleActionRequired'));
		}

		if (params.ruleId) {
			const exist = await orm(c).select().from(mailRule)
				.where(and(eq(mailRule.ruleId, Number(params.ruleId)), eq(mailRule.userId, userId))).get();
			if (!exist) {
				throw new BizError(t('ruleNotExist'));
			}
			await orm(c).update(mailRule).set(data).where(eq(mailRule.ruleId, exist.ruleId)).run();
			return { ruleId: exist.ruleId };
		}

		const row = await orm(c).insert(mailRule).values({ userId, ...data })
			.returning({ ruleId: mailRule.ruleId }).get();
		return { ruleId: row.ruleId };
	},

	async delete(c, params, userId) {
		await orm(c).delete(mailRule)
			.where(and(eq(mailRule.userId, userId), eq(mailRule.ruleId, Number(params.ruleId)))).run();
	},

	async removeByUserIds(c, userIds) {
		await orm(c).delete(mailRule).where(inArray(mailRule.userId, userIds)).run();
	},

	match(rule, emailRow) {
		const hit = (pattern, value) => !pattern || (value || '').toLowerCase().includes(pattern.toLowerCase());
		return hit(rule.fromMatch, emailRow.sendEmail)
			&& hit(rule.subjectMatch, emailRow.subject)
			&& hit(rule.contentMatch, emailRow.text || emailRow.content);
	},

	// 收信后依次应用该用户的全部启用规则；forwardFn 为可选的转发实现（message.forward）
	async applyRules(c, emailRow, forwardFn) {
		if (!emailRow.userId) {
			return;
		}
		const rules = await orm(c).select().from(mailRule)
			.where(and(eq(mailRule.userId, emailRow.userId), eq(mailRule.enabled, 1)))
			.orderBy(asc(mailRule.ruleId)).all();

		for (const rule of rules) {
			if (!this.match(rule, emailRow)) {
				continue;
			}
			try {
				if (rule.actionRead) {
					await orm(c).update(email).set({ unread: emailConst.unread.READ })
						.where(eq(email.emailId, emailRow.emailId)).run();
				}
				if (rule.actionStar) {
					const exist = await orm(c).select().from(star)
						.where(and(eq(star.userId, emailRow.userId), eq(star.emailId, emailRow.emailId))).get();
					if (!exist) {
						await orm(c).insert(star).values({ userId: emailRow.userId, emailId: emailRow.emailId }).run();
					}
				}
				if (rule.forwardTo && forwardFn) {
					for (const addr of rule.forwardTo.split(',').map(item => item.trim()).filter(Boolean)) {
						try {
							await forwardFn(addr);
						} catch (e) {
							console.error(`规则转发 ${addr} 失败：`, e);
						}
					}
				}
				if (rule.actionDelete) {
					await orm(c).update(email).set({ isDel: isDel.DELETE })
						.where(eq(email.emailId, emailRow.emailId)).run();
				}
			} catch (e) {
				console.error('收信规则执行失败: ', e);
			}
		}
	},
};

export default ruleService;
