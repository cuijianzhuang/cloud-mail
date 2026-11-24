import { defineStore } from 'pinia'

export const useWriterStore = defineStore('writer', {
    state: () => ({
        sendRecipientRecord: [],
        serverContacts: [],
        hiddenContacts: []
    }),
    persist: {
        pick: ['sendRecipientRecord', 'hiddenContacts'],
    },
})
