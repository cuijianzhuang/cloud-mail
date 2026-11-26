import http from '@/axios/index.js';

export function loginUserInfo() {
    return http.get('/my/loginUserInfo')
}

export function resetPassword(password) {
    return http.put('/my/resetPassword', {password})
}

export function userDelete() {
    return http.delete('/my/delete')
}

export function totpStatus() {
    return http.get('/my/totp')
}

export function totpSetup() {
    return http.post('/my/totp/setup')
}

export function totpEnable(code) {
    return http.post('/my/totp/enable', {code})
}

export function totpDisable(code) {
    return http.post('/my/totp/disable', {code})
}

