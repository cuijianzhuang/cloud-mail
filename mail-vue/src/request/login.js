import http from '@/axios/index.js';

export function login(email, password, token) {
    return http.post('/login', {email, password, token})
}

export function loginTotp(ticket, code) {
    return http.post('/login/totp', {ticket, code})
}

export function logout() {
    return http.delete('/logout')
}

export function register(form) {
    return http.post('/register', form)
}
