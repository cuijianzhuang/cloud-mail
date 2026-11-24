import emailUtils from '../utils/email-utils';
import { settingConst } from '../const/entity-const';

const aiService = {
	async extractCode(c, email, options = {}) {
		if (!this.shouldExtractCode(options.aiCode, options.aiCodeFilter, email)) {
			return '';
		}

		const ai = c.env.ai;

		try {
			const subject = email.subject || '';
			const text = emailUtils.formatText(email.text || '');
			const htmlText = emailUtils.htmlToText(email.html || '');
			const body = (htmlText || text).slice(0, 6000);

			if (!subject && !body) {
				return '';
			}

			const result = await ai.run(c.env.ai_model || '@cf/meta/llama-3.1-8b-instruct-fast', {
				messages: [
					{
						role: 'system',
						content: 'You extract verification codes from emails. Return only JSON like {"code":"12345678"} or {"code":""}. The code must be 8 characters or fewer and must not contain spaces. If the code is longer than 8 characters or contains spaces, return {"code":""}. Do not explain.'
					},
					{
						role: 'user',
						content: `Subject: ${subject}\n\n${body}`
					}
				],
				temperature: 0,
				max_tokens: 32
			});

			const content = typeof result === 'string' ? result : result?.response || '';
			const json = typeof content === 'string' ? JSON.parse(content) : content;
			if (typeof json.code !== 'string') {
				return '';
			}

			if (json.code.length > 8 || /\s/.test(json.code)) {
				return '';
			}

			return json.code;
		} catch (e) {
			console.error('验证码提取失败: ', e);
			return '';
		}
	},

	async runText(c, system, user, maxTokens = 512) {
		const result = await c.env.ai.run(c.env.ai_model || '@cf/meta/llama-3.1-8b-instruct-fast', {
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user }
			],
			temperature: 0.2,
			max_tokens: maxTokens
		});
		return typeof result === 'string' ? result : result?.response || '';
	},

	mailBody(emailRow) {
		const text = emailUtils.formatText(emailRow.text || '');
		const htmlText = emailUtils.htmlToText(emailRow.content || '');
		return (text || htmlText).slice(0, 8000);
	},

	async summarize(c, emailRow, lang) {
		const body = this.mailBody(emailRow);
		if (!body) return { summary: '' };
		const zh = lang !== 'en';
		const summary = await this.runText(c,
			zh ? '你是邮件助手。用简体中文把邮件总结成 3-5 条要点，每条一行、以「- 」开头，只输出要点本身，不要解释。'
				: 'You are a mail assistant. Summarize the email in 3-5 bullet points, one per line starting with "- ". Output only the bullets.',
			`Subject: ${emailRow.subject || ''}\n\n${body}`, 400);
		return { summary: summary.trim() };
	},

	async translate(c, emailRow, target) {
		const body = this.mailBody(emailRow);
		if (!body) return { translation: '' };
		const targetName = target === 'en' ? 'English' : '简体中文';
		const translation = await this.runText(c,
			`You are a translator. Translate the email into ${targetName}. Output only the translation, keep the paragraph structure.`,
			body.slice(0, 6000), 1200);
		return { translation: translation.trim() };
	},

	shouldExtractCode(aiCode, aiCodeFilterStr, email) {
		if (aiCode !== settingConst.aiCode.OPEN) {
			return false;
		}

		const filterList = aiCodeFilterStr ? aiCodeFilterStr.split(',').map(item => item.trim().toLowerCase()).filter(Boolean) : [];

		if (filterList.length === 0) {
			return true;
		}

		const fromEmail = (email.from?.address || '').trim().toLowerCase();
		const fromDomain = emailUtils.getDomain(fromEmail).toLowerCase();

		return filterList.some(item => item === fromEmail || item === fromDomain);
	}
};

export default aiService;
