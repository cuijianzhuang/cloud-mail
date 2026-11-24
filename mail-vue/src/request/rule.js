import http from "@/axios/index.js";

export function ruleList() {
    return http.get('/rule/list')
}

export function ruleSave(params) {
    return http.post('/rule/save', params)
}

export function ruleDelete(ruleId) {
    return http.delete('/rule/delete', {data: {ruleId}})
}
