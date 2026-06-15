import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { X, Camera } from 'lucide-react'

export default function EscanerBarras({ onScan, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const [error, setError] = useState('')
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader

    reader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
      if (result && scanning) {
        setScanning(false)
        onScan(result.getText())
      }
    }).catch(err => {
      setError('No se pudo acceder a la cámara. Verificá los permisos.')
    })

    return () => {
      try { BrowserMultiFormatReader.releaseAllStreams() } catch {}
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Escanear código</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="relative bg-black">
          <video ref={videoRef} className="w-full aspect-video object-cover" />
          {/* Visor */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-32 border-2 border-white rounded-lg opacity-70">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
            </div>
          </div>
        </div>

        <div className="p-4 text-center">
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {scanning ? 'Apuntá la cámara al código de barras del producto' : '✓ Código detectado'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
