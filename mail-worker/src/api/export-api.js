import app from '../hono/hono';
import exportService from '../service/export-service';
import userContext from '../security/user-context';

app.get('/email/export', async (c) => {
	const { eml, filename } = await exportService.exportEml(c, c.req.query(), userContext.getUserId(c));
	return new Response(eml, {
		headers: {
			'Content-Type': 'message/rfc822; charset=UTF-8',
			'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
		},
	});
});

app.get('/email/export-mbox', async (c) => {
	const { mbox, count } = await exportService.exportMbox(c, c.req.query(), userContext.getUserId(c));
	return new Response(mbox, {
		headers: {
			'Content-Type': 'application/mbox; charset=UTF-8',
			'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent('cloud-mail-export.mbox')}`,
			'X-Export-Count': String(count),
		},
	});
});
