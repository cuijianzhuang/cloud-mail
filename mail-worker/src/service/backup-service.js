import BizError from '../error/biz-error';
import userService from './user-service';
import { t } from '../i18n/i18n';

// 整站备份覆盖的表（按依赖顺序排列，便于日后恢复时按序导入）。
// 不含 email_fts（FTS 索引，可由 email 表重建）和 verify_record（临时验证码记录）。
const BACKUP_TABLES = [
	'setting',
	'user',
	'role',
	'perm',
	'role_perm',
	'reg_key',
	'account',
	'account_signature',
	'email',
	'attachments',
	'star',
	'draft',
	'mail_rule',
	'scheduled_send',
	'oauth',
];

const backupService = {

	// 整站备份导出：仅站长账号（env.admin 对应的用户）可用，备份含密钥与密码哈希，务必妥善保管
	async exportAll(c, userId) {
		const userRow = await userService.selectById(c, userId);
		if (!userRow || userRow.email !== c.env.admin) {
			throw new BizError(t('notAdmin'), 403);
		}
		const tables = {};
		for (const table of BACKUP_TABLES) {
			const { results } = await c.env.db.prepare(`SELECT * FROM "${table}"`).all();
			tables[table] = results;
		}
		return {
			app: 'cloud-mail',
			backupVersion: 1,
			exportedAt: new Date().toISOString(),
			tables,
		};
	},
};

export default backupService;
