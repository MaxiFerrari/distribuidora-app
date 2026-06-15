import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ShoppingCart, Loader2 } from 'lucide-react'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setSuccess('¡Cuenta creada! Revisá tu email para confirmar (o iniciá sesión directo si la confirmación está desactivada).')
        setMode('login')
      }
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'Email o contraseña incorrectos.',
        'Email not confirmed': 'Confirmá tu email antes de ingresar.',
        'User already registered': 'Ya existe una cuenta con ese email.',
      }
      setError(msgs[err.message] || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShoppingCart size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Distribuidora</h1>
          <p className="text-gray-500 text-sm mt-1">Gestor de Pedidos · Tucumán</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-7">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-gray-500">
            {mode === 'login' ? (
              <>¿No tenés cuenta?{' '}
                <button onClick={() => { setMode('register'); setError('') }} className="text-blue-600 font-medium hover:underline">
                  Registrate
                </button>
              </>
            ) : (
              <>¿Ya tenés cuenta?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-blue-600 font-medium hover:underline">
                  Iniciá sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
