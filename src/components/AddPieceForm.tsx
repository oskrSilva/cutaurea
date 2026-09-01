import { useState } from 'react';
import { Plus, Scissors, Square, Layers, Ruler } from 'lucide-react';
import type { Piece } from '@/types';

interface AddPieceFormProps {
  onAdd: (piece: Omit<Piece, 'id'>) => void;
}

export function AddPieceForm({ onAdd }: AddPieceFormProps) {
  const [label, setLabel] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    const q = parseInt(quantity, 10) || 1;

    if (w > 0 && h > 0) {
      onAdd({
        label: label.trim() || `Pieza ${w}×${h}`,
        width: w,
        height: h,
        quantity: q,
      });
      setLabel('');
      setWidth('');
      setHeight('');
      setQuantity('1');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            <Ruler className="w-3 h-3 inline mr-1" />
            Ancho (mm)
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="600"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            min={1}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            <Ruler className="w-3 h-3 inline mr-1" />
            Largo (mm)
          </label>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="400"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            min={1}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            <Square className="w-3 h-3 inline mr-1" />
            Etiqueta
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Lateral"
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            <Layers className="w-3 h-3 inline mr-1" />
            Cantidad
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            min={1}
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar pieza
      </button>
    </form>
  );
}
