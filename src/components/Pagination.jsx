import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ currentPage, totalPages, onNext, onPrev, hasNext, hasPrev, totalItems }) {
  if (totalPages <= 1) return null

  const itemsPerPage = 50
  const start = (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Mostrando <span className="font-medium">{start} - {end}</span> de <span className="font-medium">{totalItems}</span>
      </p>
      <div className="flex gap-2 items-center">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <div className="flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300">
          Página <span className="font-medium mx-1">{currentPage}</span> de <span className="font-medium ml-1">{totalPages}</span>
        </div>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
