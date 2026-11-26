import app from '../hono/hono';
import backupService from '../service/backup-service';
import result from '../model/result';
import settingService from '../service/setting-service';
import resendService from '../service/resend-service';
import userContext from "../security/user-context";

// 验证 Resend token：传 token 验输入框里的，传 domainKey 验已保存的（'*' 为共享）
app.post('/setting/resend-verify', async (c) => {
	const params = await c.req.json();
	let token = params.token;
	if (!token && params.domainKey) {
		const { resendTokens } = await settingService.query(c);
		token = resendTokens[params.domainKey];
	}
	const data = await resendService.verifyToken(token);
	return c.json(result.ok(data));
});

app.put('/setting/set', async (c) => {
	await settingService.set(c, await c.req.json());
	return c.json(result.ok());
});

app.get('/setting/query', async (c) => {
	const setting = await settingService.get(c);
	return c.json(result.ok(setting));
});

app.get('/setting/websiteConfig', async (c) => {
	const setting = await settingService.websiteConfig(c);
	return c.json(result.ok(setting));
})

app.put('/setting/setBackground', async (c) => {
	const key = await settingService.setBackground(c, await c.req.json());
	return c.json(result.ok(key));
});

app.delete('/setting/deleteBackground', async (c) => {
	await settingService.deleteBackground(c);
	return c.json(result.ok());
});

app.put('/setting/setBlacklist', async (c) => {
	const setting = await settingService.setBlacklist(c, await c.req.json());
	return c.json(result.ok(setting));
});

// 整站备份导出：返回 JSON 文件流（不走 result 包装），仅站长可用（服务层校验）
app.get('/setting/backup-export', async (c) => {
	const data = await backupService.exportAll(c, userContext.getUserId(c));
	const date = new Date().toISOString().slice(0, 10);
	return c.body(JSON.stringify(data), 200, {
		'Content-Type': 'application/json; charset=utf-8',
		'Content-Disposition': `attachment; filename="cloud-mail-backup-${date}.json"`,
	});
});

