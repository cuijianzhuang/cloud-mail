import { defineStore } from 'pinia'
import { emailUnreadCounts } from '@/request/email.js'

export const useUnreadStore = defineStore('unread', {
    state: () => ({
        total: 0,
        byAccount: {}
    }),
    actions: {
        async refresh() {
            try {
                const data = await emailUnreadCounts()
                this.total = data?.total || 0
                this.byAccount = data?.byAccount || {}
            } catch {
                // 未读数只是徽标，拉取失败静默
            }
        }
    }
})
