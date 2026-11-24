import app from '../hono/hono';
import aiService from '../service/ai-service';
import emailService from '../service/email-service';
import BizError from '../error/biz-error';
import userContext from '../security/user-context';
import result from '../model/result';
import { t } from '../i18n/i18n';

async function loadOwnedEmail(c, emailId, userId) {
	const emailRow = await emailService.selectById(c, Number(emailId));
	if (!emailRow || emailRow.userId !== userId) {
		throw new BizError(t('aiEmailNotExist'));
	}
	return emailRow;
}

app.post('/ai/summarize', async (c) => {
	const params = await c.req.json();
	const emailRow = await loadOwnedEmail(c, params.emailId, userContext.getUserId(c));
	const data = await aiService.summarize(c, emailRow, params.lang);
	return c.json(result.ok(data));
});

app.post('/ai/translate', async (c) => {
	const params = await c.req.json();
	const emailRow = await loadOwnedEmail(c, params.emailId, userContext.getUserId(c));
	const data = await aiService.translate(c, emailRow, params.target);
	return c.json(result.ok(data));
});
