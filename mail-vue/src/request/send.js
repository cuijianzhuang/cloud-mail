import http from "@/axios/index.js";

export function sendEmail(form) {
    return http.post('/send/sendEmail', form)
}

export function sendList(accountId, sendId, size) {
    return http.get('/send/list',{ params: {accountId, sendId, size}})
}

export function sendDelete(sendIds) {
    return http.delete('/send/delete?sendIds=' + sendIds);
}