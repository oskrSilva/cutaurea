import type { BoardLayout } from '@/types';

interface BoardVisualizerProps {
  board: BoardLayout;
  boardWidth: number;
  boardHeight: number;
  boardIndex: number;
  totalBoards: number;
}

const PIECE_COLORS = [
  '#0d9488', '#0891b2', '#0284c7', '#2563eb', '#4f46e5',
  '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48',
  '#f97316', '#ca8a04', '#65a30d', '#16a34a', '#0d9488',
];

export function BoardVisualizer({
  board,
  boardWidth,
  boardHeight,
  boardIndex,
  totalBoards,
}: BoardVisualizerProps) {
  const padding = 24;
  const labelHeight = 28;
  const maxW = 900;
  const aspectRatio = boardWidth / boardHeight;
  const renderW = Math.min(maxW, aspectRatio > 1 ? maxW : maxW * aspectRatio);
  const renderH = renderW / aspectRatio;
  const scale = renderW / boardWidth;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-600 text-white text-sm font-bold">
            {boardIndex + 1}
          </span>
          <h4 className="text-sm font-semibold text-slate-700">
            Placa {boardIndex + 1} de {totalBoards}
          </h4>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="font-medium text-teal-600">
            {board.efficiency.toFixed(1)}% aprovechamiento
          </span>
          <span>{board.placed.length} piezas</span>
        </div>
      </div>

      <div className="p-4 flex justify-center bg-slate-50/50">
        <div
          className="relative bg-amber-50 border-2 border-amber-300 rounded"
          style={{ width: renderW + padding * 2, height: renderH + padding * 2 + labelHeight }}
        >
          {/* Board surface */}
          <div
            className="absolute bg-amber-100 border border-amber-200 rounded-sm"
            style={{
              left: padding,
              top: padding,
              width: renderW,
              height: renderH,
            }}
          >
            {board.placed.map((piece, i) => {
              const colorIndex =
                piece.pieceId.charCodeAt(0) % PIECE_COLORS.length;
              const color = PIECE_COLORS[colorIndex];
              const left = piece.x * scale;
              const top = piece.y * scale;
              const w = piece.width * scale;
              const h = piece.height * scale;
              const showLabel = w > 50 && h > 30;

              return (
                <div
                  key={`${piece.pieceId}-${i}`}
                  className="absolute border-2 rounded-sm flex flex-col items-center justify-center transition-all duration-300 hover:z-10 hover:shadow-lg cursor-default group"
                  style={{
                    left,
                    top,
                    width: w,
                    height: h,
                    backgroundColor: color + '20',
                    borderColor: color,
                  }}
                  title={`${piece.label}: ${piece.width}×${piece.height}mm${piece.rotated ? ' (rotada)' : ''}`}
                >
                  {showLabel && (
                    <>
                      <span
                        className="text-[10px] font-semibold leading-tight px-1 text-center"
                        style={{ color }}
                      >
                        {piece.label}
                      </span>
                      <span className="text-[9px] text-slate-500 leading-tight">
                        {piece.width}×{piece.height}
                      </span>
                      {piece.rotated && (
                        <span className="text-[8px] text-slate-400">↻</span>
                      )}
                    </>
                  )}
                  {!showLabel && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Dimension labels */}
          <div
            className="absolute text-[10px] text-slate-400 font-medium flex items-center justify-center"
            style={{
              left: padding,
              top: padding + renderH + 4,
              width: renderW,
              height: labelHeight - 8,
            }}
          >
            {boardWidth} mm
          </div>
          <div
            className="absolute text-[10px] text-slate-400 font-medium flex items-center justify-center"
            style={{
              left: 2,
              top: padding,
              width: padding - 6,
              height: renderH,
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
            }}
          >
            {boardHeight} mm
          </div>
        </div>
      </div>
    </div>
  );
}
