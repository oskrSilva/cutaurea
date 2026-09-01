import type { Piece, BoardConfig, CutResult, PlacedPiece, BoardLayout } from '@/types';

interface FreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ExpandedPiece {
  pieceId: string;
  label: string;
  width: number; // includes kerf
  height: number; // includes kerf
}

function fitsIn(w: number, h: number, space: FreeRect): boolean {
  return w <= space.width && h <= space.height;
}

function calcEfficiency(placed: PlacedPiece[], boardArea: number): number {
  const used = placed.reduce((sum, p) => sum + p.width * p.height, 0);
  return boardArea > 0 ? (used / boardArea) * 100 : 0;
}

function computeFreeRects(placed: PlacedPiece[], boardW: number, boardH: number): FreeRect[] {
  let freeRects: FreeRect[] = [{ x: 0, y: 0, width: boardW, height: boardH }];

  for (const p of placed) {
    const pW = p.width;
    const pH = p.height;
    const px = p.x;
    const py = p.y;
    const next: FreeRect[] = [];

    for (const fr of freeRects) {
      const noOverlap =
        px >= fr.x + fr.width || px + pW <= fr.x || py >= fr.y + fr.height || py + pH <= fr.y;
      if (noOverlap) {
        next.push(fr);
        continue;
      }
      // Left slice
      if (px > fr.x) {
        next.push({ x: fr.x, y: fr.y, width: px - fr.x, height: fr.height });
      }
      // Right slice
      if (px + pW < fr.x + fr.width) {
        next.push({ x: px + pW, y: fr.y, width: fr.x + fr.width - (px + pW), height: fr.height });
      }
      // Top slice
      if (py > fr.y) {
        next.push({ x: fr.x, y: fr.y, width: fr.width, height: py - fr.y });
      }
      // Bottom slice
      if (py + pH < fr.y + fr.height) {
        next.push({ x: fr.x, y: py + pH, width: fr.width, height: fr.y + fr.height - (py + pH) });
      }
    }

    freeRects = [];
    const seen = new Set<string>();
    for (const r of next) {
      if (r.width <= 0 || r.height <= 0) continue;
      const key = `${r.x},${r.y},${r.width},${r.height}`;
      if (seen.has(key)) continue;
      seen.add(key);
      freeRects.push(r);
    }
  }

  return freeRects;
}

function tryPlace(
  item: ExpandedPiece,
  board: BoardLayout,
  boardW: number,
  boardH: number,
  kerf: number
): PlacedPiece | null {
  const freeRects = computeFreeRects(board.placed, boardW, boardH);

  let best: { rect: FreeRect; rotated: boolean; score: number } | null = null;

  for (const fr of freeRects) {
    // Without rotation
    if (fitsIn(item.width, item.height, fr)) {
      const score = Math.min(fr.width - item.width, fr.height - item.height);
      if (!best || score < best.score) {
        best = { rect: fr, rotated: false, score };
      }
    }
    // With rotation
    if (fitsIn(item.height, item.width, fr)) {
      const score = Math.min(fr.width - item.height, fr.height - item.width);
      if (!best || score < best.score) {
        best = { rect: fr, rotated: true, score };
      }
    }
  }

  if (!best) return null;

  const placedW = best.rotated ? item.height : item.width;
  const placedH = best.rotated ? item.width : item.height;

  return {
    pieceId: item.pieceId,
    label: item.label,
    x: best.rect.x,
    y: best.rect.y,
    width: placedW - kerf,
    height: placedH - kerf,
    rotated: best.rotated,
  };
}

/**
 * Guillotine cut bin packing with best-short-side-fit (BSSF) heuristic.
 * Pieces are expanded by quantity, sorted by area descending,
 * and placed across multiple boards as needed.
 */
export function optimizeCuts(pieces: Piece[], config: BoardConfig): CutResult {
  const { width: boardW, height: boardH, kerf } = config;
  const boardArea = boardW * boardH;

  const expanded: ExpandedPiece[] = [];
  for (const p of pieces) {
    for (let i = 0; i < p.quantity; i++) {
      expanded.push({
        pieceId: p.id,
        label: p.label,
        width: p.width + kerf,
        height: p.height + kerf,
      });
    }
  }

  expanded.sort((a, b) => b.width * b.height - a.width * a.height);

  const boards: BoardLayout[] = [];
  const unplacedMap = new Map<string, { pieceId: string; count: number }>();

  for (const item of expanded) {
    let placed = false;

    for (const board of boards) {
      const result = tryPlace(item, board, boardW, boardH, kerf);
      if (result) {
        board.placed.push(result);
        board.usedArea = board.placed.reduce((s, p) => s + p.width * p.height, 0);
        board.efficiency = calcEfficiency(board.placed, boardArea);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const newBoard: BoardLayout = {
        boardIndex: boards.length,
        placed: [],
        usedArea: 0,
        efficiency: 0,
      };
      const result = tryPlace(item, newBoard, boardW, boardH, kerf);
      if (result) {
        newBoard.placed.push(result);
        newBoard.usedArea = newBoard.placed.reduce((s, p) => s + p.width * p.height, 0);
        newBoard.efficiency = calcEfficiency(newBoard.placed, boardArea);
        boards.push(newBoard);
        placed = true;
      }
    }

    if (!placed) {
      const existing = unplacedMap.get(item.label);
      if (existing) {
        existing.count += 1;
      } else {
        unplacedMap.set(item.label, { pieceId: item.pieceId, count: 1 });
      }
    }
  }

  const unplaced = Array.from(unplacedMap.entries()).map(([label, { pieceId, count }]) => ({
    pieceId,
    label,
    count,
  }));

  const totalEfficiency =
    boards.length > 0
      ? boards.reduce((s, b) => s + b.efficiency, 0) / boards.length
      : 0;

  return {
    boards,
    unplaced,
    totalBoards: boards.length,
    totalEfficiency,
  };
}
