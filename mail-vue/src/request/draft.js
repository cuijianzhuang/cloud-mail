import http from "@/axios/index.js";

export function draftSave(params) {
    return http.post('/draft/save', params)
}

export function draftList() {
    return http.get('/draft/list')
}

export function draftDetail(draftId) {
    return http.get('/draft/detail', {params: {draftId}})
}

export function draftDelete(draftIds) {
    return http.delete('/draft/delete', {data: {draftIds}})
}
