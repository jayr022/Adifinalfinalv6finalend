import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { RotateCcw, Trophy } from 'lucide-react';

interface SlidingPuzzleProps {
  imageSrc: string;
  gridSize?: number;
}

interface Tile {
  id: number;
  currentPosition: number;
}

export function SlidingPuzzle({ imageSrc, gridSize = 3 }: SlidingPuzzleProps) {
  const totalTiles = gridSize * gridSize;
  const blankTileId = totalTiles - 1; // Last tile is blank initially
  
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [moves, setMoves] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Initialize and shuffle puzzle
  useEffect(() => {
    initializePuzzle();
  }, []);

  const initializePuzzle = () => {
    // Create tiles with correct positions
    const initialTiles: Tile[] = Array.from({ length: totalTiles }, (_, i) => ({
      id: i,
      currentPosition: i,
    }));

    // Shuffle the puzzle (ensuring it's solvable)
    const shuffled = shufflePuzzle(initialTiles);
    setTiles(shuffled);
    setIsSolved(false);
    setMoves(0);
  };

  const handleStart = () => {
    setHasStarted(true);
    initializePuzzle();
  };

  const handleReset = () => {
    setHasStarted(false);
    setIsSolved(false);
    setMoves(0);
  };

  const shufflePuzzle = (tiles: Tile[]): Tile[] => {
    const shuffled = [...tiles];
    // Perform random valid moves to ensure solvability
    let blankPos = blankTileId;
    
    for (let i = 0; i < 100; i++) {
      const validMoves = getValidMoves(blankPos, gridSize);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      
      // Swap blank with random valid neighbor
      const blankIndex = shuffled.findIndex(t => t.currentPosition === blankPos);
      const tileIndex = shuffled.findIndex(t => t.currentPosition === randomMove);
      
      shuffled[blankIndex].currentPosition = randomMove;
      shuffled[tileIndex].currentPosition = blankPos;
      blankPos = randomMove;
    }
    
    return shuffled;
  };

  const getValidMoves = (position: number, gridSize: number): number[] => {
    const moves: number[] = [];
    const row = Math.floor(position / gridSize);
    const col = position % gridSize;

    // Up
    if (row > 0) moves.push(position - gridSize);
    // Down
    if (row < gridSize - 1) moves.push(position + gridSize);
    // Left
    if (col > 0) moves.push(position - 1);
    // Right
    if (col < gridSize - 1) moves.push(position + 1);

    return moves;
  };

  const handleTileClick = (clickedTile: Tile) => {
    if (isSolved) return;

    const blankTile = tiles.find(t => t.id === blankTileId)!;
    const validMoves = getValidMoves(blankTile.currentPosition, gridSize);

    // Check if clicked tile is adjacent to blank
    if (validMoves.includes(clickedTile.currentPosition)) {
      const newTiles = tiles.map(t => {
        if (t.id === clickedTile.id) {
          return { ...t, currentPosition: blankTile.currentPosition };
        }
        if (t.id === blankTileId) {
          return { ...t, currentPosition: clickedTile.currentPosition };
        }
        return t;
      });

      setTiles(newTiles);
      setMoves(m => m + 1);
      
      // Check if solved
      checkIfSolved(newTiles);
    }
  };

  const checkIfSolved = (currentTiles: Tile[]) => {
    const solved = currentTiles.every(tile => tile.id === tile.currentPosition);
    if (solved) {
      setIsSolved(true);
    }
  };

  const getTileStyle = (tile: Tile) => {
    const row = Math.floor(tile.currentPosition / gridSize);
    const col = tile.currentPosition % gridSize;
    const originalRow = Math.floor(tile.id / gridSize);
    const originalCol = tile.id % gridSize;

    const tileSize = 100 / gridSize;
    
    return {
      position: 'absolute' as const,
      left: `${col * tileSize}%`,
      top: `${row * tileSize}%`,
      width: `${tileSize}%`,
      height: `${tileSize}%`,
      backgroundImage: `url(${imageSrc})`,
      backgroundSize: `${gridSize * 100}%`,
      backgroundPosition: `${originalCol * 100 / (gridSize - 1)}% ${originalRow * 100 / (gridSize - 1)}%`,
      transition: 'all 0.3s ease',
    };
  };

  // Show preview before starting
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center gap-6 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Valentine's Day Sliding Puzzle</h1>
          <p className="text-lg text-muted-foreground mb-1">Solve the puzzle for a surprise</p>
          <p className="text-sm text-muted-foreground">
            Click tiles adjacent to the blank space to slide them
          </p>
        </div>

        <div className="relative w-full max-w-2xl aspect-[3/4] border-4 border-border rounded-lg overflow-hidden shadow-2xl">
          <img src={imageSrc} alt="Puzzle preview" className="w-full h-full object-cover" />
        </div>

        <Button onClick={handleStart} size="lg" className="text-lg px-8 py-6">
          Start Puzzle
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Valentine's Day Sliding Puzzle</h1>
        <p className="text-lg text-muted-foreground mb-1">Solve the puzzle for a surprise</p>
        <p className="text-sm text-muted-foreground">
          Click tiles adjacent to the blank space to slide them
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-lg font-semibold">Moves: {moves}</div>
        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw className="size-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="relative w-full max-w-2xl aspect-[3/4] border-4 border-border rounded-lg overflow-hidden shadow-2xl">
        {tiles.map(tile => (
          <div
            key={tile.id}
            style={getTileStyle(tile)}
            className={`cursor-pointer border border-background/50 ${
              tile.id === blankTileId && !isSolved ? 'opacity-0' : 'hover:brightness-110'
            }`}
            onClick={() => handleTileClick(tile)}
          />
        ))}
        
        {isSolved && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background p-8 rounded-lg shadow-xl text-center">
              <Trophy className="size-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">You complete me.</h2>
              <p className="text-muted-foreground mb-4">
                Solved in {moves} moves!
              </p>
              <Button onClick={handleReset}>
                Play Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}