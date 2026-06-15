import { useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { TrendingUp, ShoppingCart, Users, Package } from 'lucide-react'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function Estadisticas() {
  const { state } = useApp()

  const pedidosEntregados = state.pedidos.filter(p => p.estado === 'entregado')

  const ventasPorMes = useMemo(() => {
    const map = {}
    pedidosEntregados.forEach(p => {
      const d = new Date(p.fecha)
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2,'0')}`
      if (!map[key]) map[key] = { mes: MESES[d.getMonth()], ventas: 0, pedidos: 0 }
      map[key].ventas += p.total
      map[key].pedidos += 1
    })
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).slice(-6).map(([,v]) => v)
  }, [pedidosEntregados])

  const topClientes = useMemo(() => {
    const map = {}
    pedidosEntregados.forEach(p => {
      if (!map[p.clienteId]) map[p.clienteId] = { nombre: p.clienteNombre, total: 0, pedidos: 0 }
      map[p.clienteId].total += p.total
      map[p.clienteId].pedidos += 1
    })
    return Object.values(map).sort((a,b) => b.total - a.total).slice(0, 5)
  }, [pedidosEntregados])

  const topProductos = useMemo(() => {
    const map = {}
    pedidosEntregados.forEach(p => {
      p.items.forEach(i => {
        if (!map[i.nombre]) map[i.nombre] = { nombre: i.nombre, cantidad: 0, monto: 0 }
        map[i.nombre].cantidad += i.cantidad
        map[i.nombre].monto += i.cantidad * i.precioUnitario * (1 - i.descuento / 100)
      })
    })
    return Object.values(map).sort((a,b) => b.monto - a.monto).slice(0, 5)
  }, [pedidosEntregados])

  const totalVentas = pedidosEntregados.reduce((s,p) => s + p.total, 0)
  const mesActual = new Date().getMonth()
  const ventasMes = pedidosEntregados.filter(p => new Date(p.fecha).getMonth() === mesActual).reduce((s,p) => s + p.total, 0)

  const stats = [
    { label: 'Ventas totales', value: formatCurrency(totalVentas), icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Este mes', value: formatCurrency(ventasMes), icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Clientes activos', value: state.clientes.length, icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Pedidos entregados', value: pedidosEntregados.length, icon: Package, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ]

  const tooltipStyle = { backgroundColor: 'var(--tooltip-bg, #1f2937)', border: 'none', borderRadius: 8, color: '#f9fafb', fontSize: 12 }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estadísticas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Resumen de ventas y rendimiento</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Gráfico ventas por mes */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Ventas por mes</h2>
        {ventasPorMes.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">Sin datos de ventas aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ventasPorMes} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => formatCurrency(v).replace('ARS','$')} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [formatCurrency(v), 'Ventas']} />
              <Bar dataKey="ventas" fill="#2563eb" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pedidos por mes */}
      {ventasPorMes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Pedidos entregados por mes</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ventasPorMes} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={v => [v, 'Pedidos']} />
              <Line type="monotone" dataKey="pedidos" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top clientes */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top 5 clientes</h2>
          {topClientes.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">Sin datos</p> : (
            <div className="space-y-3">
              {topClientes.map((c, i) => (
                <div key={c.nombre} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{c.pedidos} pedido{c.pedidos !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">{formatCurrency(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top productos */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top 5 productos</h2>
          {topProductos.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">Sin datos</p> : (
            <div className="space-y-3">
              {topProductos.map((p, i) => (
                <div key={p.nombre} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.cantidad} unidades</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">{formatCurrency(p.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
