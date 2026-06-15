export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function calcDescuento(cantidad) {
  if (cantidad >= 24) return 10
  if (cantidad >= 12) return 5
  return 0
}

export function calcTotales(items) {
  const subtotal = items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
  const descuentoTotal = items.reduce((sum, item) => {
    const base = item.cantidad * item.precioUnitario
    return sum + base * (item.descuento / 100)
  }, 0)
  return { subtotal, descuentoTotal, total: subtotal - descuentoTotal }
}

export function isToday(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  return d.toDateString() === now.toDateString()
}

export function isThisWeek(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return d >= startOfWeek
}
