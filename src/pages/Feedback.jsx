import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useDistribuidora } from '../context/DistribuidoraContext'
import { MessageSquare, ThumbsUp, ThumbsDown, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Feedback() {
  const { user } = useAuth()
  const { distribuidora } = useDistribuidora()
  const [tipo, setTipo] = useState('sugerencia')
  const [mensaje, setMensaje] = useState('')
  const [urgencia, setUrgencia] = useState('media')
  const [sending, setSending] = useState(false)

  async function enviarFeedback(e) {
    e.preventDefault()
    if (!mensaje.trim()) {
      toast.error('Escribí tu feedback antes de enviar')
      return
    }

    setSending(true)
    try {
      // Guardar en tabla feedback
      const { error } = await supabase
        .from('feedback')
        .insert([{
          user_id: user.id,
          distribuidora_id: distribuidora?.id,
          email: user.email,
          tipo,
          mensaje: mensaje.trim(),
          urgencia,
          url_actual: window.location.href,
          user_agent: navigator.userAgent
        }])

      if (error) throw error

      toast.success('¡Gracias por tu feedback! Lo revisaremos pronto.')
      setMensaje('')
      setTipo('sugerencia')
      setUrgencia('media')
    } catch (err) {
      toast.error('Error al enviar: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare size={32} className="text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tu Opinión es Importante
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta app está en <span className="font-semibold text-blue-600">Beta Gratuita</span>.
          Tu feedback nos ayuda a mejorarla para vos y otros distribuidores.
        </p>
      </div>

      {/* Beta Badge */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎉</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Acceso Beta Gratuito
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estás usando la app <strong>gratis</strong> durante la fase beta.
              No hay límites ni restricciones. Solo pedimos feedback honesto.
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={enviarFeedback} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">

        {/* Tipo de feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ¿Qué querés decirnos?
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTipo('bug')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                tipo === 'bug'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-700'
              }`}
            >
              <ThumbsDown size={20} className={tipo === 'bug' ? 'text-red-600' : 'text-gray-400'} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Bug/Error</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('sugerencia')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                tipo === 'sugerencia'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
            >
              <MessageSquare size={20} className={tipo === 'sugerencia' ? 'text-blue-600' : 'text-gray-400'} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Sugerencia</span>
            </button>

            <button
              type="button"
              onClick={() => setTipo('elogio')}
              className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                tipo === 'elogio'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
              }`}
            >
              <ThumbsUp size={20} className={tipo === 'elogio' ? 'text-green-600' : 'text-gray-400'} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Me Gusta</span>
            </button>
          </div>
        </div>

        {/* Urgencia (solo si es bug) */}
        {tipo === 'bug' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ¿Qué tan grave es?
            </label>
            <select
              value={urgencia}
              onChange={e => setUrgencia(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="baja">Baja - Molesto pero puedo trabajar</option>
              <option value="media">Media - Complica mi trabajo</option>
              <option value="alta">Alta - No puedo usar esa función</option>
              <option value="critica">Crítica - La app no funciona</option>
            </select>
          </div>
        )}

        {/* Mensaje */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contanos más
          </label>
          <textarea
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            rows={6}
            placeholder={
              tipo === 'bug'
                ? 'Describí qué pasó, qué esperabas que pasara, y los pasos para reproducirlo...'
                : tipo === 'sugerencia'
                ? 'Describí qué feature o mejora te gustaría ver...'
                : 'Contanos qué te gustó y por qué...'
            }
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Cuanto más detalle, mejor podemos ayudarte
          </p>
        </div>

        {/* Botón enviar */}
        <button
          type="submit"
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send size={18} />
              Enviar Feedback
            </>
          )}
        </button>
      </form>

      {/* Footer motivacional */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          💙 Gracias por ayudarnos a construir la mejor app para distribuidoras
        </p>
      </div>
    </div>
  )
}
