import app from '../hono/hono';
import loginService from '../service/login-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.post('/login', async (c) => {
	const res = await loginService.login(c, await c.req.json());
	// 开启两步验证时返回 { totpRequired: true, ticket }，前端转到验码步骤
	return c.json(result.ok(typeof res === 'string' ? { token: res } : res));
});

app.post('/login/totp', async (c) => {
	const token = await loginService.verifyTotp(c, await c.req.json());
	return c.json(result.ok({ token: token }));
});

app.post('/register', async (c) => {
	const jwt = await loginService.register(c, await c.req.json());
	return c.json(result.ok(jwt));
});

app.delete('/logout', async (c) => {
	await loginService.logout(c, userContext.getUserId(c));
	return c.json(result.ok());
});

