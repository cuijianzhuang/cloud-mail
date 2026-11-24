import http from "@/axios/index.js";

export function aiSummarize(emailId, lang) {
    return http.post('/ai/summarize', {emailId, lang})
}

export function aiTranslate(emailId, target) {
    return http.post('/ai/translate', {emailId, target})
}
