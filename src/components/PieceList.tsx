import { Trash2, Plus, Minus, Volume2 } from 'lucide-react';
import type { Piece } from '@/types';

interface PieceListProps {
  pieces: Piece[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export function PieceList({ pieces, onRemove, onUpdateQuantity }: PieceListProps) {
  if (pieces.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-3">
          <Volume2 className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500">
          No hay piezas. Agrega piezas por voz o manualmente.
        </p>
      </div>
    );
  }

  const totalPieces = pieces.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500">
          {pieces.length} tipo{pieces.length !== 1 ? 's' : ''} · {totalPieces} pieza{totalPieces !== 1 ? 's' : ''} en total
        </span>
      </div>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2.5 hover:shadow-sm transition-shadow"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-700 truncate">
              {piece.label}
            </div>
            <div className="text-xs text-slate-500">
              {piece.width} × {piece.height} mm
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateQuantity(piece.id, -1)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-slate-700">
              {piece.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(piece.id, 1)}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onRemove(piece.id)}
            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
            aria-label="Eliminar pieza"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
