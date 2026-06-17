import { X, AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ title, message, confirmText = 'Eliminar', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button onClick={onCancel} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancelar
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
