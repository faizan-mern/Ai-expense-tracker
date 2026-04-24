import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="flex items-center justify-between gap-3 pt-4 mt-4 border-t border-black/[0.07]">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-black/5 text-[#14211c] hover:bg-black/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={15} />
        Previous
      </button>

      <span className="text-sm text-[#63736b] font-medium">
        Page <strong className="text-[#14211c]">{currentPage}</strong> of{" "}
        <strong className="text-[#14211c]">{totalPages}</strong>
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-black/5 text-[#14211c] hover:bg-black/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
