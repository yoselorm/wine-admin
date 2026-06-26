import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ meta, onPageChange }) => {
  if (!meta) return null;

  // Fallbacks to support both snake_case (Laravel) and camelCase payloads
  const currentPage = meta.current_page || meta.currentPage || 1;
  const lastPage = meta.last_page || meta.lastPage || meta.total_pages || 1;
  const totalItems = meta.total || 0;
  const from = meta.from || 0;
  const to = meta.to || 0;

  // Render nothing if there's only 1 page
  if (lastPage <= 1) return null;

  // Bulletproof page range generator
  const getPageNumbers = () => {
    // If total pages are small, just return a simple sequential array (prevents your bug!)
    if (lastPage <= 5) {
      return Array.from({ length: lastPage }, (_, i) => i + 1);
    }

    // For larger sets, use a Set to automatically discard duplicate page indexes
    const pages = new Set();
    pages.add(1);
    pages.add(lastPage);

    // Dynamic middle window
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(lastPage - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.add(i);
    }

    // Convert back to a sorted array and insert ellipses smoothly
    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const multiPageArray = [];
    let prev = 0;

    for (const page of sortedPages) {
      if (prev + 1 < page) {
        multiPageArray.push('...');
      }
      multiPageArray.push(page);
      prev = page;
    }

    return multiPageArray;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
      {/* Left Metadata Readout */}
      <div>
        Showing <span className="font-semibold text-zinc-700">{from}-{to}</span> of{' '}
        <span className="font-semibold text-zinc-700">{totalItems}</span> items
      </div>

      {/* Control Buttons Group */}
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Dynamic Page Items */}
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2.5 py-1.5 text-zinc-400 select-none">
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
              className={`inline-flex items-center justify-center min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-zinc-950 border-zinc-950 text-white shadow-xs'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage === lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;