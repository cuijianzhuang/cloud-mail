import app from '../hono/hono';
import userService from '../service/user-service';
import totpService from '../service/totp-service';
import result from '../model/result';
import userContext from '../security/user-context';

app.get('/my/loginUserInfo', async (c) => {
	const user = await userService.loginUserInfo(c, userContext.getUserId(c));
	return c.json(result.ok(user));
});

app.put('/my/resetPassword', async (c) => {
	await userService.resetPassword(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.delete('/my/delete', async (c) => {
	await userService.delete(c, userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/my/totp', async (c) => {
	const data = await totpService.status(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/my/totp/setup', async (c) => {
	const data = await totpService.setup(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/my/totp/enable', async (c) => {
	const { code } = await c.req.json();
	const data = await totpService.enable(c, userContext.getUserId(c), code);
	return c.json(result.ok(data));
});

app.post('/my/totp/disable', async (c) => {
	const { code } = await c.req.json();
	await totpService.disable(c, userContext.getUserId(c), code);
	return c.json(result.ok());
});


