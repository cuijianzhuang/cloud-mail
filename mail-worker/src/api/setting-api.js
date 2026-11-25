import app from '../hono/hono';
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
})

