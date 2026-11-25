import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
    state: () => ({
        asideShow: window.innerWidth > 1024,
        accountShow: false,
        backgroundLoading: true,
        changeNotice: 0,
        noticeForce: false,
        writerRef: null,
        changePreview: 0,
        previewData: {},
        key: 0,
        dark: false,
        asideCount: {
            email: 0,
            send: 0,
            sysEmail: 0
        }
    }),
    actions: {
        showNotice(force = false) {
            this.noticeForce = force
            this.changeNotice ++
        },
        previewNotice(data) {
            this.previewData = data
            this.changePreview ++
        }
    },
    persist: {
        pick: ['accountShow','dark'],
    },
})
