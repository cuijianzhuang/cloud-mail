import app from '../hono/hono';
import scheduledSendService from '../service/scheduled-send-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.post('/scheduled/create', async (c) => {
	const data = await scheduledSendService.create(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.get('/scheduled/list', async (c) => {
	const data = await scheduledSendService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.delete('/scheduled/cancel', async (c) => {
	await scheduledSendService.cancel(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});
