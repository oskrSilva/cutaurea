export interface Piece {
  id: string;
  label: string;
  width: number;
  height: number;
  quantity: number;
}

export interface BoardConfig {
  width: number;
  height: number;
  kerf: number;
}

export interface PlacedPiece {
  pieceId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
}

export interface BoardLayout {
  boardIndex: number;
  placed: PlacedPiece[];
  usedArea: number;
  efficiency: number;
}

export interface CutResult {
  boards: BoardLayout[];
  unplaced: { pieceId: string; label: string; count: number }[];
  totalBoards: number;
  totalEfficiency: number;
}

export interface CutProject {
  id: string;
  name: string;
  board_width: number;
  board_height: number;
  kerf: number;
  pieces: Piece[];
  created_at: string;
  updated_at: string;
}
