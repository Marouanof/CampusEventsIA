export function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const categoryConfig = {
  Talk: { icon: 'mic', color: '#0040a0', bg: '#f0f7ff', label: 'Talk' },
  Workshop: { icon: 'build', color: '#b45309', bg: '#fffbeb', label: 'Workshop' },
  Club: { icon: 'people', color: '#059669', bg: '#f0fdf4', label: 'Club' },
  Exam: { icon: 'document-text', color: '#dc2626', bg: '#fef2f2', label: 'Exam' },
  Other: { icon: 'calendar', color: '#6b7280', bg: '#f9fafb', label: 'Other' },
}

export function formatDate(iso) {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatTime(iso) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
