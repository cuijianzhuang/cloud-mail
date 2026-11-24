import app from '../hono/hono';
import draftService from '../service/draft-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.post('/draft/save', async (c) => {
	const data = await draftService.save(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.get('/draft/list', async (c) => {
	const data = await draftService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.get('/draft/detail', async (c) => {
	const data = await draftService.detail(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.delete('/draft/delete', async (c) => {
	await draftService.delete(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});
