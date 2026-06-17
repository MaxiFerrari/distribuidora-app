import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-8xl font-black text-gray-200 dark:text-gray-700 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Página no encontrada</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">La página que buscás no existe o fue movida.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={16} /> Volver
          </button>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold text-white transition-colors">
            <Home size={16} /> Ir al inicio
          </button>
        </div>
      </div>
    </div>
  )
}
