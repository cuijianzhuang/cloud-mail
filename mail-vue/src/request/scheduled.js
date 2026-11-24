import http from "@/axios/index.js";

export function scheduledCreate(params) {
    return http.post('/scheduled/create', params)
}

export function scheduledList() {
    return http.get('/scheduled/list')
}

export function scheduledCancel(scheduleId) {
    return http.delete('/scheduled/cancel', {data: {scheduleId}})
}
