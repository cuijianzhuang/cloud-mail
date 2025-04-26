import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-cn')
dayjs.tz.setDefault('Asia/Shanghai')

function day(time) {
  return dayjs(time).add(8, 'hours')
}

export const fromNow = (time) => {
    return time ? day(time).fromNow() : ''
}

export default day