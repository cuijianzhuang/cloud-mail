import orm from '../entity/orm';
import email from '../entity/email';
import BizError from '../error/biz-error';
import { and, asc, eq } from 'drizzle-orm';
import { isDel } from '../const/entity-const';
import emailService from './email-service';
import attService from './att-service';
import r2Service from './r2-service';
import forwardMime from '../utils/forward-mime';
import { t } from '../i18n/i18n';

function parseList(value) {
	try {
		const list = JSON.parse(value || '[]');
		return Array.isArray(list) ? list : [];
	} catch {
		return [];
	}
}

const exportService = {

	// 收到的邮件没有存原始 MIME，导出是按落库字段重建的（forwardMime.build），
	// 信头/正文/附件齐全，但不保证与原始报文逐字节一致。
	async buildEml(c, emailRow) {
		const attRows = await attService.selectByEmailIds(c, [emailRow.emailId]);
		const attachments = [];
		for (const attRow of attRows) {
			try {
				const resp = await r2Service.toObjResp(c, attRow.key);
				if (!resp) continue;
				attachments.push({
					filename: attRow.filename || 'file',
					type: attRow.mimeType || 'application/octet-stream',
					content: await resp.arrayBuffer(),
				});
			} catch (e) {
				console.error('导出附件读取失败: ', e);
			}
		}

		const recipients = parseList(emailRow.recipient);
		const eml = forwardMime.build({
			accountEmail: emailRow.sendEmail,
			name: emailRow.name,
			receiveEmail: recipients.length ? recipients : [{ address: emailRow.toEmail, name: emailRow.toName }],
			ccEmail: parseList(emailRow.cc),
			subject: emailRow.subject || '',
			text: emailRow.text || '',
			html: emailRow.content || '',
			attachments,
		});

		const date = new Date(String(emailRow.createTime || '').replace(' ', 'T') + 'Z');
		const extra = [];
		if (!isNaN(date.getTime())) extra.push(`Date: ${date.toUTCString()}`);
		if (emailRow.messageId) extra.push(`Message-ID: ${emailRow.messageId}`);
		if (!extra.length) return eml;
		return eml.replace('MIME-Version: 1.0', `${extra.join('\r\n')}\r\nMIME-Version: 1.0`);
	},

	async exportEml(c, params, userId) {
		const emailRow = await emailService.selectById(c, Number(params.emailId));
		if (!emailRow || emailRow.userId !== userId) {
			throw new BizError(t('exportNotExistEmail'));
		}
		const eml = await this.buildEml(c, emailRow);
		const filename = `${(emailRow.subject || 'email').replace(/[\\/:*?"<>|\r\n]+/g, '_').slice(0, 80)}.eml`;
		return { eml, filename };
	},

	// 按账户（或全部账户）批量导出为 mbox：上限 1000 封，超出按时间正序截断
	async exportMbox(c, params, userId) {
		const conditions = [eq(email.userId, userId), eq(email.isDel, isDel.NORMAL)];
		if (params.accountId) conditions.push(eq(email.accountId, Number(params.accountId)));
		if (params.type !== undefined && params.type !== '') conditions.push(eq(email.type, Number(params.type)));

		const rows = await orm(c).select().from(email)
			.where(and(...conditions)).orderBy(asc(email.emailId)).limit(1000).all();

		const parts = [];
		for (const row of rows) {
			const eml = await this.buildEml(c, row);
			const date = new Date(String(row.createTime || '').replace(' ', 'T') + 'Z');
			parts.push(`From - ${isNaN(date.getTime()) ? '' : date.toUTCString()}\n${eml}\n`);
		}
		return { mbox: parts.join('\n'), count: rows.length };
	},
};

export default exportService;
