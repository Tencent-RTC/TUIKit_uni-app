/**
 * 时间格式化工具函数
 */

/**
 * 格式化时间戳为可读时间
 * @param timestamp 时间戳（秒）
 * @param detailed 是否显示详细时间（年月日）
 * @returns 格式化后的时间字符串
 */
export const formatTime = (timestamp: number, detailed: boolean = false): string => {
  if (!timestamp) return ''
  
  const now = new Date()
  const messageDate = new Date(timestamp * 1000) // 转换为毫秒
  
  // 计算时间差（毫秒）
  const timeDiff = now.getTime() - messageDate.getTime()
  const oneDayMs = 24 * 60 * 60 * 1000
  const oneWeekMs = 7 * oneDayMs
  
  // 今天
  if (messageDate.toDateString() === now.toDateString()) {
    const hours = messageDate.getHours().toString().padStart(2, '0')
    const minutes = messageDate.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  // 昨天
  if (timeDiff < oneDayMs * 2) {
    const hours = messageDate.getHours().toString().padStart(2, '0')
    const minutes = messageDate.getMinutes().toString().padStart(2, '0')
    return `昨天 ${hours}:${minutes}`
  }
  
  // 一周内
  if (timeDiff < oneWeekMs) {
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekDay = weekDays[messageDate.getDay()]
    const hours = messageDate.getHours().toString().padStart(2, '0')
    const minutes = messageDate.getMinutes().toString().padStart(2, '0')
    return `${weekDay} ${hours}:${minutes}`
  }
  
  // 一年内
  if (messageDate.getFullYear() === now.getFullYear()) {
    const month = (messageDate.getMonth() + 1).toString().padStart(2, '0')
    const day = messageDate.getDate().toString().padStart(2, '0')
    
    if (detailed) {
      const hours = messageDate.getHours().toString().padStart(2, '0')
      const minutes = messageDate.getMinutes().toString().padStart(2, '0')
      return `${month}月${day}日 ${hours}:${minutes}`
    }
    
    return `${month}月${day}日`
  }
  
  // 跨年
  const year = messageDate.getFullYear()
  const month = (messageDate.getMonth() + 1).toString().padStart(2, '0')
  const day = messageDate.getDate().toString().padStart(2, '0')
  
  if (detailed) {
    const hours = messageDate.getHours().toString().padStart(2, '0')
    const minutes = messageDate.getMinutes().toString().padStart(2, '0')
    return `${year}年${month}月${day}日 ${hours}:${minutes}`
  }
  
  return `${year}年${month}月${day}日`
}

/**
 * 格式化文件大小
 * @param size 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 */
export const formatFileSize = (size: number): string => {
  if (!size) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let fileSize = size
  let unitIndex = 0
  
  while (fileSize >= 1024 && unitIndex < units.length - 1) {
    fileSize /= 1024
    unitIndex++
  }
  
  return `${fileSize.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

/**
 * 格式化音频时长
 * @param duration 时长（秒）
 * @returns 格式化后的时长字符串
 */
export const formatDuration = (duration: number): string => {
  if (!duration) return '0:00'
  
  const minutes = Math.floor(duration / 60)
  const seconds = Math.floor(duration % 60)
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}