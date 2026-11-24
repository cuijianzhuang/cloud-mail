import app from '../hono/hono';
import ruleService from '../service/rule-service';
import userContext from '../security/user-context';
import result from '../model/result';

app.get('/rule/list', async (c) => {
	const data = await ruleService.list(c, userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/rule/save', async (c) => {
	const data = await ruleService.save(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.delete('/rule/delete', async (c) => {
	await ruleService.delete(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
});
