import { LayoutGrid, TrendingUp, Layers, AlertTriangle, Scissors } from 'lucide-react';
import type { CutResult, BoardConfig } from '@/types';

interface StatsPanelProps {
  result: CutResult;
  config: BoardConfig;
  totalPieces: number;
}

export function StatsPanel({ result, config, totalPieces }: StatsPanelProps) {
  const totalBoardArea = result.totalBoards * config.width * config.height;
  const totalPieceArea = result.boards.reduce(
    (sum, b) => sum + b.placed.reduce((s, p) => s + p.width * p.height, 0),
    0
  );
  const wasteArea = totalBoardArea - totalPieceArea;
  const wastePercent = totalBoardArea > 0 ? (wasteArea / totalBoardArea) * 100 : 0;

  const stats = [
    {
      label: 'Placas necesarias',
      value: result.totalBoards.toString(),
      icon: LayoutGrid,
      color: 'teal',
    },
    {
      label: 'Aprovechamiento',
      value: `${result.totalEfficiency.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'emerald',
    },
    {
      label: 'Piezas colocadas',
      value: totalPieces.toString(),
      icon: Layers,
      color: 'blue',
    },
    {
      label: 'Desperdicio',
      value: `${wastePercent.toFixed(1)}%`,
      icon: Scissors,
      color: 'amber',
    },
  ];

  const colorMap: Record<string, string> = {
    teal: 'bg-teal-50 text-teal-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-3"
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colorMap[stat.color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-lg font-bold text-slate-800">{stat.value}</div>
              <div className="text-[11px] text-slate-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {result.unplaced.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Piezas que no cupieron:</span>
            <ul className="mt-1 space-y-0.5">
              {result.unplaced.map((u) => (
                <li key={u.label}>
                  {u.label}: {u.count} unidad{u.count !== 1 ? 'es' : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
