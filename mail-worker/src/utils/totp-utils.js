// TOTP 两步验证工具（RFC 4226/6238），基于 WebCrypto HMAC-SHA1，无第三方依赖

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes) {
	let bits = 0;
	let value = 0;
	let output = '';
	for (const byte of bytes) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
			bits -= 5;
		}
	}
	if (bits > 0) {
		output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
	}
	return output;
}

function base32Decode(text) {
	const clean = String(text).replace(/=+$/, '').toUpperCase();
	let bits = 0;
	let value = 0;
	const output = [];
	for (const ch of clean) {
		const idx = BASE32_ALPHABET.indexOf(ch);
		if (idx === -1) continue;
		value = (value << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			output.push((value >>> (bits - 8)) & 255);
			bits -= 8;
		}
	}
	return new Uint8Array(output);
}

async function hotp(secret, counter) {
	const key = await crypto.subtle.importKey('raw', base32Decode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
	const msg = new Uint8Array(8);
	let c = BigInt(counter);
	for (let i = 7; i >= 0; i--) {
		msg[i] = Number(c & 0xffn);
		c >>= 8n;
	}
	const hash = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg));
	const offset = hash[hash.length - 1] & 0x0f;
	const binary = ((hash[offset] & 0x7f) << 24) | ((hash[offset + 1] & 0xff) << 16) | ((hash[offset + 2] & 0xff) << 8) | (hash[offset + 3] & 0xff);
	return String(binary % 1000000).padStart(6, '0');
}

const totpUtils = {

	generateSecret() {
		return base32Encode(crypto.getRandomValues(new Uint8Array(20)));
	},

	// 校验 6 位动态码，允许前后各一个时间步（30 秒）的时钟偏差
	async verify(secret, code) {
		const normalized = String(code || '').trim();
		if (!secret || !/^\d{6}$/.test(normalized)) {
			return false;
		}
		const counter = Math.floor(Date.now() / 30000);
		for (let i = -1; i <= 1; i++) {
			if (await hotp(secret, counter + i) === normalized) {
				return true;
			}
		}
		return false;
	},

	// 生成 8 个恢复码，格式 XXXX-XXXX（十六进制）
	generateRecoveryCodes() {
		const codes = [];
		for (let i = 0; i < 8; i++) {
			const hex = [...crypto.getRandomValues(new Uint8Array(4))]
				.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
			codes.push(`${hex.slice(0, 4)}-${hex.slice(4)}`);
		}
		return codes;
	},

	// 恢复码入库前哈希（去分隔符、大写后 SHA-256）
	async hashCode(code) {
		const normalized = String(code || '').replace(/[-\s]/g, '').toUpperCase();
		const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
		return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
	},
};

export default totpUtils;
