import { useNavigate } from 'react-router-dom'
import { Package, Users, ShoppingCart, ArrowRight, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

const PASOS = [
  {
    num: 1, icon: Package, color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    titulo: 'Cargá tus productos',
    desc: 'Agregá los productos que vendés con sus precios y stock.',
    accion: 'Ir a Inventario', ruta: '/inventario',
  },
  {
    num: 2, icon: Users, color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
    titulo: 'Registrá tus clientes',
    desc: 'Agregá los almacenes, kioscos o negocios a los que les vendés.',
    accion: 'Ir a Clientes', ruta: '/clientes',
  },
  {
    num: 3, icon: ShoppingCart, color: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    titulo: 'Creá tu primer pedido',
    desc: 'Seleccioná un cliente, elegí los productos y exportá el PDF o compartí por WhatsApp.',
    accion: 'Crear pedido', ruta: '/pedidos/nuevo',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { state } = useApp()

  const completados = [
    state.productos.length > 0,
    state.clientes.length > 0,
    state.pedidos.length > 0,
  ]

  function cerrar() {
    localStorage.setItem('onboarding-done', 'true')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingCart size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">¡Bienvenido a Distribuidora!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Seguí estos 3 pasos para empezar</p>
        </div>

        <div className="space-y-3 mb-6">
          {PASOS.map((paso, i) => (
            <div key={paso.num} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${completados[i] ? 'bg-green-100 dark:bg-green-900/40' : paso.color}`}>
                {completados[i]
                  ? <CheckCircle size={22} className="text-green-600 dark:text-green-400" />
                  : <paso.icon size={22} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${completados[i] ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{paso.titulo}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{paso.desc}</p>
              </div>
              {!completados[i] && (
                <button onClick={() => navigate(paso.ruta)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-2 rounded-lg shrink-0 transition-colors">
                  {paso.accion} <ArrowRight size={13} />
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={cerrar} className="w-full py-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          {completados.every(Boolean) ? 'Ir al Dashboard' : 'Saltar por ahora'}
        </button>
      </div>
    </div>
  )
}
