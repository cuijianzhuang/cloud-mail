// 导出返回的是文件流而不是 JSON，不能走 http 拦截器（它按 code 解包），单独用 fetch 带令牌下载
async function download(path, params, filename) {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}${path}?${query}`, {
        headers: {Authorization: `${localStorage.getItem('token')}`},
    });
    if (!res.ok) {
        throw new Error(`export failed: ${res.status}`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportEml(emailId, subject) {
    const name = `${(subject || 'email').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80)}.eml`;
    return download('/email/export', {emailId}, name);
}

export function exportMbox(accountId, type) {
    return download('/email/export-mbox', {accountId, type}, 'cloud-mail-export.mbox');
}
