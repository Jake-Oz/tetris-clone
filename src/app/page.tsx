"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivePiece,
  BOARD_HEIGHT,
  BOARD_WIDTH,
  Board,
  COLOR_MAP,
  canPlace,
  clearLines,
  createEmptyBoard,
  getRandomPiece,
  placePiece,
  projectGhost,
  rotate,
} from "@/lib/tetris";

type Stats = {
  score: number;
  lines: number;
  level: number;
};

const lineScore = [0, 100, 300, 500, 800];

export default function Home() {
  const [board, setBoard] = useState<Board>(() => createEmptyBoard());
  const [active, setActive] = useState<ActivePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<ActivePiece | null>(null);
  const [stats, setStats] = useState<Stats>({ score: 0, lines: 0, level: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const dropDelay = useMemo(
    () => Math.max(120, 1000 - stats.level * 80),
    [stats.level]
  );

  const resetGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setActive(getRandomPiece());
    setNextPiece(getRandomPiece());
    setStats({ score: 0, lines: 0, level: 0 });
    setIsPaused(false);
    setIsGameOver(false);
  }, []);

  const spawnPiece = useCallback(
    (currentBoard: Board) => {
      if (!nextPiece) return;
      const incoming = getRandomPiece();
      const positionedNext = {
        ...nextPiece,
        position: {
          x:
            Math.floor(BOARD_WIDTH / 2) -
            Math.ceil(nextPiece.shape[0].length / 2),
          y: 0,
        },
      };
      if (
        !canPlace(currentBoard, positionedNext.shape, positionedNext.position)
      ) {
        setIsGameOver(true);
        return;
      }
      setActive(positionedNext);
      setNextPiece(incoming);
    },
    [nextPiece]
  );

  const lockPiece = useCallback(
    (pieceToLock?: ActivePiece) => {
      const locking = pieceToLock ?? active;
      if (!locking) return;
      const merged = placePiece(board, locking);
      const { board: clearedBoard, cleared } = clearLines(merged);

      if (cleared > 0) {
        setStats((prev) => {
          const totalLines = prev.lines + cleared;
          const level = Math.floor(totalLines / 10);
          const score = prev.score + lineScore[cleared] * (level + 1);
          return { score, lines: totalLines, level };
        });
      }

      setBoard(clearedBoard);
      spawnPiece(clearedBoard);
    },
    [active, board, spawnPiece]
  );

  const tryMove = useCallback(
    (dx: number, dy: number) => {
      if (isPaused || isGameOver || !active) return;

      const moved = {
        ...active,
        position: {
          x: active.position.x + dx,
          y: active.position.y + dy,
        },
      };

      if (canPlace(board, moved.shape, moved.position)) {
        setActive(moved);
      } else if (dy === 1) {
        lockPiece(active);
      }
    },
    [active, board, isGameOver, isPaused, lockPiece]
  );

  const hardDrop = useCallback(() => {
    if (isPaused || isGameOver || !active) return;
    const ghost = projectGhost(board, active);
    lockPiece(ghost);
  }, [active, board, isGameOver, isPaused, lockPiece]);

  const rotateActive = useCallback(() => {
    if (isPaused || isGameOver || !active) return;
    const rotated = rotate(active.shape);
    const candidate = { ...active, shape: rotated };
    const offsets = [0, -1, 1, -2, 2];

    for (const dx of offsets) {
      const shifted = {
        ...candidate,
        position: { x: active.position.x + dx, y: active.position.y },
      };
      if (canPlace(board, shifted.shape, shifted.position)) {
        setActive(shifted);
        break;
      }
    }
  }, [active, board, isGameOver, isPaused]);

  useEffect(() => {
    if (!active || isPaused || isGameOver) return;
    const timer = setInterval(() => {
      tryMove(0, 1);
    }, dropDelay);
    return () => clearInterval(timer);
  }, [active, dropDelay, isPaused, isGameOver, tryMove]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (isGameOver && event.key.toLowerCase() === "r") {
        resetGame();
        return;
      }

      if (event.key.toLowerCase() === "p") {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused || isGameOver) return;

      switch (event.key) {
        case "ArrowLeft":
          tryMove(-1, 0);
          break;
        case "ArrowRight":
          tryMove(1, 0);
          break;
        case "ArrowDown":
          tryMove(0, 1);
          break;
        case "ArrowUp":
        case "w":
        case "W":
          rotateActive();
          break;
        case " ":
          event.preventDefault();
          hardDrop();
          break;
        case "r":
        case "R":
          resetGame();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [hardDrop, isGameOver, isPaused, resetGame, rotateActive, tryMove]);

  const paintBoard = useMemo(() => {
    if (!active) return board;
    const withGhost = projectGhost(board, active);
    const grid: Board = board.map((row) => row.slice());

    for (let y = 0; y < withGhost.shape.length; y++) {
      for (let x = 0; x < withGhost.shape[y].length; x++) {
        if (!withGhost.shape[y][x]) continue;
        const gx = withGhost.position.x + x;
        const gy = withGhost.position.y + y;
        if (gy >= 0 && !grid[gy][gx]) {
          grid[gy][gx] = { color: "#5fb0ff", ghost: true };
        }
      }
    }

    for (let y = 0; y < active.shape.length; y++) {
      for (let x = 0; x < active.shape[y].length; x++) {
        if (!active.shape[y][x]) continue;
        const px = active.position.x + x;
        const py = active.position.y + y;
        if (py >= 0 && py < BOARD_HEIGHT && px >= 0 && px < BOARD_WIDTH) {
          grid[py][px] = { color: COLOR_MAP[active.key] };
        }
      }
    }

    return grid;
  }, [active, board]);

  const nextPreview = useMemo(() => {
    if (!nextPiece) return Array.from({ length: 4 }, () => Array(4).fill(null));
    const rows = nextPiece.shape.length;
    const cols = nextPiece.shape[0].length;
    const previewRows = Array.from({ length: 4 }, (_, row) =>
      Array.from({ length: 4 }, (_, col) =>
        row < rows && col < cols && nextPiece.shape[row]?.[col]
          ? COLOR_MAP[nextPiece.key]
          : null
      )
    );
    return previewRows;
  }, [nextPiece]);

  useEffect(() => {
    // Initialize random pieces on client to avoid hydration mismatch.
    if (!active && !nextPiece) {
      const id = requestAnimationFrame(() => {
        setActive(getRandomPiece());
        setNextPiece(getRandomPiece());
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [active, nextPiece]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 md:flex-row md:items-start md:py-12">
      <div className="glass-panel pixel-border w-full max-w-[360px] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Retro Blocks
            </p>
            <h1 className="text-2xl font-semibold text-white">Tetris Clone</h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/90">{`Level ${
            stats.level + 1
          }`}</div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-slate-200">
          <StatCard
            label="Score"
            value={stats.score.toLocaleString()}
            accent="var(--nintendo-cyan)"
          />
          <StatCard
            label="Lines"
            value={stats.lines.toString()}
            accent="var(--nintendo-yellow)"
          />
          <StatCard label="Next" value="" accent="var(--nintendo-magenta)">
            <div className="mt-3 grid grid-cols-4 gap-1">
              {nextPreview.flat().map((color, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-sm border border-white/5"
                  style={{
                    backgroundColor: color ?? "transparent",
                    opacity: color ? 1 : 0.15,
                  }}
                />
              ))}
            </div>
          </StatCard>
          <StatCard
            label="State"
            value={isGameOver ? "Game Over" : isPaused ? "Paused" : "Running"}
            accent="var(--nintendo-red)"
          />
        </div>

        <div className="mt-6 space-y-2 text-xs text-slate-300">
          <p className="font-semibold text-white">Controls</p>
          <div className="flex flex-wrap gap-2">
            <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1">
              ← →
            </kbd>
            <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1">
              ↓
            </kbd>
            <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1">
              ↑
            </kbd>
            <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1">
              Space
            </kbd>
            <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1">
              P
            </kbd>
            <kbd className="rounded border border-white/20 bg-white/10 px-2 py-1">
              R
            </kbd>
          </div>
          <p className="text-slate-400">
            Move, soft drop, rotate, hard drop, pause, reset.
          </p>
        </div>

        <div className="mt-4 flex gap-3 text-sm">
          <button
            className="w-full rounded-lg border border-white/15 bg-gradient-to-r from-[#0f4ba6] to-[#00c8f8] px-4 py-2 font-semibold text-white shadow-lg shadow-blue-900/50 transition hover:brightness-110"
            onClick={() => setIsPaused((prev) => !prev)}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            className="w-full rounded-lg border border-white/15 bg-gradient-to-r from-[#e60012] to-[#e4007f] px-4 py-2 font-semibold text-white shadow-lg shadow-rose-900/50 transition hover:brightness-110"
            onClick={resetGame}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(95,176,255,0.08),_transparent_45%),_linear-gradient(180deg,_rgba(255,255,255,0.04),_rgba(255,255,255,0))] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="grid grid-cols-10 gap-[4px] rounded-xl border border-white/10 bg-[#0b0f1b] p-4 shadow-inner shadow-black/40">
            {paintBoard.map((row, y) =>
              row.map((cell, x) => {
                const baseColor = cell?.color ?? "#0f1220";
                const opacity = cell?.ghost ? 0.35 : 1;
                return (
                  <div
                    key={`${y}-${x}`}
                    className="aspect-square rounded-sm border border-black/40 shadow-[0_2px_0_rgba(0,0,0,0.35)]"
                    style={{
                      backgroundColor: baseColor,
                      opacity,
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {isGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="glass-panel pixel-border max-w-sm rounded-xl p-6 text-center">
              <h2 className="text-2xl font-semibold text-white">Game Over</h2>
              <p className="mt-2 text-sm text-slate-200">
                Score {stats.score.toLocaleString()} • Lines {stats.lines}
              </p>
              <button
                className="mt-4 w-full rounded-lg border border-white/15 bg-gradient-to-r from-[#e60012] to-[#ffd500] px-4 py-2 font-semibold text-white shadow-lg shadow-amber-900/50 transition hover:brightness-110"
                onClick={resetGame}
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-4 gap-3 text-xs text-slate-200 md:hidden">
          <ControlButton label="Left" onClick={() => tryMove(-1, 0)} />
          <ControlButton label="Drop" onClick={hardDrop} highlight />
          <ControlButton label="Right" onClick={() => tryMove(1, 0)} />
          <ControlButton
            label={isPaused ? "Resume" : "Pause"}
            onClick={() => setIsPaused((p) => !p)}
          />
          <ControlButton label="Rotate" onClick={rotateActive} />
          <ControlButton label="Down" onClick={() => tryMove(0, 1)} />
          <ControlButton label="Reset" onClick={resetGame} />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  children,
}: {
  label: string;
  value: string;
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-panel w-full rounded-xl px-3 py-3 text-left">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="text-lg font-semibold text-white" style={{ color: accent }}>
        {value}
      </p>
      {children}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  highlight,
}: {
  label: string;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      className={`rounded-lg border border-white/15 px-3 py-2 font-semibold text-white shadow-lg shadow-black/40 transition active:translate-y-[1px] ${
        highlight
          ? "bg-gradient-to-r from-[#ffd500] to-[#e4007f]"
          : "bg-white/5"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
