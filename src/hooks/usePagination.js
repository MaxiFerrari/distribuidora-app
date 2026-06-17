import { useState, useMemo, useEffect } from 'react'

export function usePagination(items, itemsPerPage = 50) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return items.slice(start, end)
  }, [items, currentPage, itemsPerPage])

  function nextPage() {
    setCurrentPage(p => Math.min(p + 1, totalPages))
  }

  function prevPage() {
    setCurrentPage(p => Math.max(p - 1, 1))
  }

  function goToPage(page) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Reset page when items change significantly
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [items.length, totalPages, currentPage])

  return {
    currentPage,
    totalPages,
    paginatedItems,
    nextPage,
    prevPage,
    goToPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    totalItems: items.length
  }
}
