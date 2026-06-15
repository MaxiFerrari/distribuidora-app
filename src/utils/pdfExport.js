import jsPDF from 'jspdf'
import { formatCurrency, formatDate } from './helpers'

export function exportPedidoPDF(pedido) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = 210
  const margin = 15
  let y = 20

  // Header
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('DISTRIBUIDORA', margin, 18)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Gestor de Pedidos', margin, 26)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`PEDIDO #${pedido.id.toUpperCase()}`, pageW - margin, 18, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(formatDate(pedido.fecha), pageW - margin, 26, { align: 'right' })

  const estadoColors = { pendiente: [251, 191, 36], entregado: [34, 197, 94], cancelado: [239, 68, 68] }
  const [r, g, b] = estadoColors[pedido.estado] || [156, 163, 175]
  doc.setFillColor(r, g, b)
  doc.roundedRect(pageW - margin - 28, 30, 28, 7, 2, 2, 'F')
  doc.setTextColor(50, 50, 50)
  doc.setFontSize(9)
  doc.text(pedido.estado.toUpperCase(), pageW - margin - 14, 35.2, { align: 'center' })

  y = 52
  doc.setTextColor(30, 30, 30)

  // Cliente info
  doc.setFillColor(241, 245, 249)
  doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 116, 139)
  doc.text('CLIENTE', margin + 4, y + 7)
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(pedido.clienteNombre, margin + 4, y + 16)

  if (pedido.clienteTelefono) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(`Tel: ${pedido.clienteTelefono}`, pageW / 2, y + 16)
  }

  y += 30

  // Tabla items
  const colX = [margin, margin + 80, margin + 110, margin + 140, margin + 170]
  const headers = ['Producto', 'Cant.', 'Precio Unit.', 'Desc.', 'Subtotal']

  doc.setFillColor(37, 99, 235)
  doc.rect(margin, y, pageW - margin * 2, 9, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  headers.forEach((h, i) => {
    const align = i === 0 ? 'left' : 'right'
    const x = i === 0 ? colX[i] + 2 : colX[i] + (i === 4 ? pageW - margin - colX[i] - 2 : 28)
    doc.text(h, x, y + 6.5, { align })
  })

  y += 9
  doc.setFont('helvetica', 'normal')
  pedido.items.forEach((item, idx) => {
    const rowH = 9
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, pageW - margin * 2, rowH, 'F')
    }
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(9)
    const subtotalItem = item.cantidad * item.precioUnitario * (1 - item.descuento / 100)
    doc.text(item.nombre, colX[0] + 2, y + 6.2)
    doc.text(String(item.cantidad), colX[1] + 28, y + 6.2, { align: 'right' })
    doc.text(formatCurrency(item.precioUnitario), colX[2] + 28, y + 6.2, { align: 'right' })
    if (item.descuento > 0) {
      doc.setTextColor(22, 163, 74)
      doc.text(`-${item.descuento}%`, colX[3] + 28, y + 6.2, { align: 'right' })
      doc.setTextColor(15, 23, 42)
    } else {
      doc.text('—', colX[3] + 28, y + 6.2, { align: 'right' })
    }
    doc.text(formatCurrency(subtotalItem), pageW - margin - 2, y + 6.2, { align: 'right' })
    y += rowH
  })

  // Línea separadora
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y + 2, pageW - margin, y + 2)
  y += 8

  // Totales
  const totalesX = pageW - margin - 70
  const labelX = totalesX + 2
  const valueX = pageW - margin - 2

  doc.setFontSize(10)
  doc.setTextColor(71, 85, 105)
  doc.text('Subtotal:', labelX, y)
  doc.text(formatCurrency(pedido.subtotal), valueX, y, { align: 'right' })
  y += 7

  if (pedido.descuentoTotal > 0) {
    doc.setTextColor(22, 163, 74)
    doc.text('Descuento:', labelX, y)
    doc.text(`- ${formatCurrency(pedido.descuentoTotal)}`, valueX, y, { align: 'right' })
    y += 7
  }

  doc.setFillColor(37, 99, 235)
  doc.rect(totalesX, y - 1, pageW - margin - totalesX, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', labelX, y + 7)
  doc.text(formatCurrency(pedido.total), valueX, y + 7, { align: 'right' })

  y += 18

  if (pedido.notas) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`Notas: ${pedido.notas}`, margin, y)
    y += 8
  }

  // Footer
  doc.setFillColor(241, 245, 249)
  doc.rect(0, 282, pageW, 15, 'F')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('Generado con Gestor de Pedidos — Distribuidoras Tucumán', pageW / 2, 291, { align: 'center' })

  doc.save(`pedido-${pedido.id}.pdf`)
}
