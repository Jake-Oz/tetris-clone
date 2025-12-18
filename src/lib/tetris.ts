export type PieceKey = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Cell = {
  color: string;
  ghost?: boolean;
};

export type Board = (Cell | null)[][];

export interface ActivePiece {
  key: PieceKey;
  shape: number[][];
  position: { x: number; y: number };
}

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const COLOR_MAP: Record<PieceKey, string> = {
  I: "#00c8f8",
  O: "#ffd500",
  T: "#e4007f",
  S: "#2ab200",
  Z: "#e60012",
  J: "#0f4ba6",
  L: "#d85f00",
};

const SHAPES: Record<PieceKey, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [1, 1, 1],
    [0, 1, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
};

export const PIECE_TYPES: PieceKey[] = ["I", "O", "T", "S", "Z", "J", "L"];

export function createEmptyBoard(
  height = BOARD_HEIGHT,
  width = BOARD_WIDTH
): Board {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => null)
  );
}

export function rotate(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0]?.length ?? 0;
  const rotated: number[][] = Array.from({ length: cols }, () =>
    Array(rows).fill(0)
  );

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      rotated[x][rows - 1 - y] = shape[y][x];
    }
  }

  return rotated;
}

export function getRandomPiece(): ActivePiece {
  const key = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
  return {
    key,
    shape: SHAPES[key],
    position: {
      x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(SHAPES[key][0].length / 2),
      y: 0,
    },
  };
}

export function canPlace(
  board: Board,
  shape: number[][],
  pos: { x: number; y: number }
): boolean {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] === 0) continue;
      const boardX = pos.x + x;
      const boardY = pos.y + y;
      if (
        boardX < 0 ||
        boardX >= BOARD_WIDTH ||
        boardY >= BOARD_HEIGHT ||
        (boardY >= 0 && board[boardY]?.[boardX])
      ) {
        return false;
      }
    }
  }
  return true;
}

export function placePiece(board: Board, piece: ActivePiece): Board {
  const cloned = board.map((row) => row.slice());
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] === 0) continue;
      const boardX = piece.position.x + x;
      const boardY = piece.position.y + y;
      if (
        boardY >= 0 &&
        boardY < BOARD_HEIGHT &&
        boardX >= 0 &&
        boardX < BOARD_WIDTH
      ) {
        cloned[boardY][boardX] = { color: COLOR_MAP[piece.key] };
      }
    }
  }
  return cloned;
}

export function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => row.some((cell) => !cell));
  const cleared = BOARD_HEIGHT - remaining.length;
  const newRows = Array.from({ length: cleared }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );
  return { board: [...newRows, ...remaining], cleared };
}

export function projectGhost(board: Board, piece: ActivePiece): ActivePiece {
  let ghostY = piece.position.y;
  while (true) {
    const nextPos = { x: piece.position.x, y: ghostY + 1 };
    if (!canPlace(board, piece.shape, nextPos)) break;
    ghostY += 1;
  }
  return { ...piece, position: { ...piece.position, y: ghostY } };
}
