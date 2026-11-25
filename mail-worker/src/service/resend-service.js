import { Resend } from 'resend';
import emailService from './email-service';
import settingService from './setting-service';
import { emailConst } from '../const/entity-const';

function base64ToBytes(b64) {
	const bin = atob(b64);
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return bytes;
}

function bytesToBase64(bytes) {
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin);
}

// Svix 签名验证（Resend webhook 使用 Svix）：secret 形如 whsec_<base64>
async function verifySvix(secret, headers, rawBody) {
	const id = headers['svix-id'];
	const timestamp = headers['svix-timestamp'];
	const signature = headers['svix-signature'];
	if (!id || !timestamp || !signature) return false;
	if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

	const keyBytes = base64ToBytes(secret.startsWith('whsec_') ? secret.slice(6) : secret);
	const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const signed = new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`);
	const sigBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, signed));
	const expected = bytesToBase64(sigBytes);
	return signature.split(' ').some(part => {
		const [version, sig] = part.split(',');
		return version === 'v1' && sig === expected;
	});
}

const resendService = {

	// 返回 false 表示验签失败，调用方应拒绝该请求
	async verifyWebhook(c, rawBody) {
		const { resendWebhookSecret } = await settingService.query(c);
		if (!resendWebhookSecret) {
			console.warn('resend webhook: resend_webhook_secret 未配置，跳过验签');
			return true;
		}
		const headers = {
			'svix-id': c.req.header('svix-id'),
			'svix-timestamp': c.req.header('svix-timestamp'),
			'svix-signature': c.req.header('svix-signature'),
		};
		return verifySvix(resendWebhookSecret, headers, rawBody);
	},

	// 用给定 token 调 Resend 列域名：验 token 可用性 + 返回该账号名下域名及验证状态
	async verifyToken(token) {
		if (!token || !/^re_[A-Za-z0-9_]{16,}$/.test(token)) {
			return { valid: false, error: 'invalid_format' };
		}
		try {
			const resend = new Resend(token);
			const { data, error } = await resend.domains.list();
			if (error) {
				return { valid: false, error: String(error.message || error) };
			}
			const list = (data?.data ?? data ?? []).map(d => ({ name: d.name, status: d.status }));
			return { valid: true, domains: list };
		} catch (e) {
			return { valid: false, error: String(e?.message || e) };
		}
	},

	async webhooks(c, body) {

		const params = {
			resendEmailId: body.data.email_id,
			status: emailConst.status.SENT
		}

		if (body.type === 'email.delivered') {
			params.status = emailConst.status.DELIVERED
			params.message = null
		}

		if (body.type === 'email.complained') {
			params.status = emailConst.status.COMPLAINED
			params.message = null
		}

		if (body.type === 'email.bounced') {
			let bounce = body.data.bounce
			bounce = JSON.stringify(bounce);
			params.status = emailConst.status.BOUNCED
			params.message = bounce
		}

		if (body.type === 'email.delivery_delayed') {
			params.status = emailConst.status.DELAYED
			params.message = null
		}

		if (body.type === 'email.failed') {
			params.status = emailConst.status.FAILED
			params.message = body.data.failed.reason
		}

		const emailRow = await emailService.updateEmailStatus(c, params)

		if (!emailRow) {
			// 未知邮件事件（如历史数据、重复投递、测试事件）：记录日志后正常返回，
			// 避免 Resend 因连续收到 500 而熔断关闭 Webhook
			console.warn(`resend webhook: unknown email_id ${params.resendEmailId}, type ${body.type}`);
			return;
		}

	}
}

export default resendService
