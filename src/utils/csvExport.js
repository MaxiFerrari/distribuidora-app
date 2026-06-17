export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    throw new Error('No hay datos para exportar')
  }

  // Obtener headers de la primera fila
  const headers = Object.keys(data[0])

  // Crear filas CSV
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header]
        // Escapar valores que contengan comas, comillas o saltos de línea
        if (value === null || value === undefined) return ''
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }).join(',')
    )
  ]

  // Crear el CSV con BOM para Excel
  const BOM = '﻿'
  const csvContent = BOM + csvRows.join('\n')

  // Descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function prepareClientesForCSV(clientes) {
  return clientes.map(c => ({
    Nombre: c.nombre,
    Teléfono: c.telefono,
    Dirección: c.direccion || '',
    Zona: c.zona,
    'Descuento General (%)': c.descuentoGeneral || 0,
    Notas: c.notas || ''
  }))
}

export function prepareProductosForCSV(productos) {
  return productos.map(p => ({
    Nombre: p.nombre,
    Precio: p.precio,
    Unidad: p.unidad,
    Stock: p.stock,
    'Stock Mínimo': p.stockMinimo
  }))
}

export function preparePedidosForCSV(pedidos) {
  return pedidos.map(p => ({
    ID: p.id.slice(0, 8).toUpperCase(),
    Fecha: new Date(p.fecha).toLocaleDateString('es-AR'),
    Cliente: p.clienteNombre,
    Teléfono: p.clienteTelefono || '',
    Estado: p.estado,
    'Estado Pago': p.estadoPago || 'pendiente',
    Subtotal: p.subtotal,
    Descuento: p.descuentoTotal,
    Total: p.total,
    Pagado: p.montoPagado || 0,
    Saldo: p.total - (p.montoPagado || 0),
    'Método Pago': p.metodoPago || '',
    Notas: p.notas || ''
  }))
}
