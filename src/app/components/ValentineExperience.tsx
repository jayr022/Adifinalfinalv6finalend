import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Heart, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface ValentineExperienceProps {
  puzzleImageSrc: string;
  fullImageSrc: string;
  gridSize?: number;
}

interface Tile {
  id: number;
  currentPosition: number;
}

type Stage = 'envelope' | 'preview' | 'puzzle' | 'message' | 'question' | 'final';

export function ValentineExperience({ 
  puzzleImageSrc, 
  fullImageSrc,
  gridSize = 3 
}: ValentineExperienceProps) {
  const totalTiles = gridSize * gridSize;
  const blankTileId = totalTiles - 1;
  
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [stage, setStage] = useState<Stage>('envelope');
  const [noButtonPosition, setNoButtonPosition] = useState({ x: 0, y: 0 });
  const [noButtonScale, setNoButtonScale] = useState(1);
  const [noClickCount, setNoClickCount] = useState(0);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);

  const audioRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    initializePuzzle();
  }, []);

  const initializePuzzle = () => {
    const initialTiles: Tile[] = Array.from({ length: totalTiles }, (_, i) => ({
      id: i,
      currentPosition: i,
    }));

    const shuffled = shufflePuzzle(initialTiles);
    setTiles(shuffled);
    setIsSolved(false);
  };

  const handleEnvelopeClick = () => {
    setEnvelopeOpened(true);
    setTimeout(() => {
      setStage('preview');
    }, 1000);
  };

  const handleStartPuzzle = () => {
    setStage('puzzle');
    initializePuzzle();
  };

  const shufflePuzzle = (tiles: Tile[]): Tile[] => {
    const shuffled = [...tiles];
    let blankPos = blankTileId;
    
    for (let i = 0; i < 100; i++) {
      const validMoves = getValidMoves(blankPos, gridSize);
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      
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

    if (row > 0) moves.push(position - gridSize);
    if (row < gridSize - 1) moves.push(position + gridSize);
    if (col > 0) moves.push(position - 1);
    if (col < gridSize - 1) moves.push(position + 1);

    return moves;
  };

  const handleTileClick = (clickedTile: Tile) => {
    if (isSolved) return;

    const blankTile = tiles.find(t => t.id === blankTileId)!;
    const validMoves = getValidMoves(blankTile.currentPosition, gridSize);

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
      checkIfSolved(newTiles);
    }
  };

  const checkIfSolved = (currentTiles: Tile[]) => {
    const solved = currentTiles.every(tile => tile.id === tile.currentPosition);
    if (solved) {
      setIsSolved(true);
      setTimeout(() => {
        setStage('message');
      }, 1000);
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
      backgroundImage: `url(${puzzleImageSrc})`,
      backgroundSize: `${gridSize * 100}%`,
      backgroundPosition: `${originalCol * 100 / (gridSize - 1)}% ${originalRow * 100 / (gridSize - 1)}%`,
      transition: 'all 0.3s ease',
    };
  };

  const handleNoClick = () => {
    const newCount = noClickCount + 1;
    setNoClickCount(newCount);
    
    // Move button to random position
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 100;
    const randomX = Math.random() * maxX - maxX / 2;
    const randomY = Math.random() * maxY - maxY / 2;
    
    setNoButtonPosition({ x: randomX, y: randomY });
    setNoButtonScale(Math.max(0.3, 1 - newCount * 0.15));
  };

  const handleYesClick = () => {
    setStage('final');
    
    // Trigger confetti
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors: ['#ff69b4', '#ff1493', '#ff69b4', '#ffc0cb'],
      });
      
      // Add hearts
      confetti({
        ...defaults,
        particleCount: 10,
        shapes: ['circle'],
        colors: ['#ff1493', '#ff69b4'],
        origin: { x: Math.random(), y: Math.random() - 0.2 },
      });
    }, 250);
  };

  // Render Envelope Stage
  if (stage === 'envelope') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center"
        >
          <motion.div
            animate={envelopeOpened ? { 
              scale: 1.2, 
              rotate: [0, 10, -10, 0],
              opacity: 0 
            } : {
              y: [0, -20, 0]
            }}
            transition={envelopeOpened ? {
              duration: 1
            } : {
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            className="cursor-pointer"
            onClick={handleEnvelopeClick}
          >
            <div className="relative inline-block">
              <div className="bg-gradient-to-br from-pink-500 to-red-500 w-48 h-32 md:w-64 md:h-40 rounded-lg shadow-2xl flex items-center justify-center border-4 border-pink-300">
                <Mail className="size-24 md:size-32 text-white" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-4 -right-4"
              >
                <Heart className="size-12 text-pink-600 fill-pink-600" />
              </motion.div>
            </div>
          </motion.div>
          
          {!envelopeOpened && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-xl md:text-2xl font-semibold text-pink-600"
            >
              Click to open your Valentine surprise! 💌
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  // Render Preview Stage
  if (stage === 'preview') {
    return (
      <div className="flex flex-col items-center gap-6 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Spotify Player - Hidden but autoplay - starts when envelope opens */}
        <iframe
          ref={audioRef}
          style={{ display: 'none' }}
          src="https://open.spotify.com/embed/track/04Aw2jdHNkLAR9LWUIGf2b?utm_source=generator&autoplay=1"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="eager"
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-2xl md:text-4xl font-bold mb-4 text-pink-600">
            💝 Solve the Puzzle to Reveal Your Valentine Message! 💝
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Click tiles adjacent to the blank space to slide them
          </p>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md aspect-[3/4] border-4 border-pink-300 rounded-lg overflow-hidden shadow-2xl"
        >
          <img 
            src={puzzleImageSrc} 
            alt="Puzzle preview" 
            className="w-full h-full object-cover" 
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleStartPuzzle}
            size="lg"
            className="bg-pink-500 hover:bg-pink-600 text-white text-lg px-8 py-6 mt-4"
          >
            Start Puzzle 💕
          </Button>
        </motion.div>
      </div>
    );
  }

  // Render Puzzle Stage
  if (stage === 'puzzle') {
    return (
      <div className="flex flex-col lg:flex-row items-start justify-center gap-6 p-4 md:p-8 max-w-7xl mx-auto">
        {/* Spotify Player - Hidden but autoplay */}
        <iframe
          ref={audioRef}
          style={{ display: 'none' }}
          src="https://open.spotify.com/embed/track/04Aw2jdHNkLAR9LWUIGf2b?utm_source=generator&autoplay=1"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="eager"
        />

        <div className="flex flex-col items-center gap-6 flex-1">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl md:text-4xl font-bold mb-4 text-pink-600">
              💝 Solve the Puzzle to Reveal Your Valentine Message! 💝
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Click tiles adjacent to the blank space to slide them
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md aspect-[3/4] border-4 border-pink-300 rounded-lg overflow-hidden shadow-2xl"
          >
            {tiles.map(tile => (
              <div
                key={tile.id}
                style={getTileStyle(tile)}
                className={`cursor-pointer border border-white/50 ${
                  tile.id === blankTileId && !isSolved ? 'opacity-0' : 'hover:brightness-110'
                }`}
                onClick={() => handleTileClick(tile)}
              />
            ))}
            
            {isSolved && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-pink-500/20 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="bg-white p-6 rounded-lg shadow-xl">
                  <Heart className="size-16 text-pink-500 mx-auto mb-2 animate-pulse" />
                  <p className="text-xl font-bold text-pink-600">Puzzle Solved! 💕</p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Preview on the side */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="bg-white/80 backdrop-blur p-4 rounded-lg shadow-lg">
            <p className="text-sm font-semibold text-pink-600 mb-2 text-center">Preview</p>
            <div className="w-48 aspect-[3/4] border-2 border-pink-200 rounded overflow-hidden shadow-md">
              <img 
                src={puzzleImageSrc} 
                alt="Puzzle preview" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Message Stage
  if (stage === 'message') {
    return (
      <div className="flex flex-col items-center gap-6 p-4 md:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="w-full max-w-md mx-auto mb-6">
            <img
              src={fullImageSrc}
              alt="Full image"
              className="w-full h-auto rounded-lg shadow-2xl border-4 border-pink-300"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center space-y-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-pink-600 mb-2">
              You complete me Adi ko 💖
            </h2>
            
            <div className="bg-white/80 backdrop-blur p-6 rounded-lg shadow-lg max-w-2xl mx-auto text-left">
              <p className="text-base md:text-lg leading-relaxed text-gray-800">
                Happy 3rd Valentines Adi ko, yes 3 valentines na, magic di ba. I just wanted to say na I really appreciate everything that you've done for us, all the effort na ginawa mo for our relationship and for the love you give. Thank you and I know na minsan nag aaway tayo but that's part of the relationship di ba, but it should make us stronger together not apart. Yan lang for now, I love you so much
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                onClick={() => setStage('question')}
                size="lg"
                className="bg-pink-500 hover:bg-pink-600 text-white text-lg px-8 py-6 mt-4"
              >
                Continue 💕
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Render Question Stage
  if (stage === 'question') {
    return (
      <div className="flex flex-col items-center justify-center gap-8 p-4 md:p-8 min-h-screen">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-pink-600 mb-8">
            Will you be my Valentine? 💝
          </h1>
          
          <div className="flex gap-6 justify-center items-center relative">
            <Button
              onClick={handleYesClick}
              size="lg"
              className="bg-pink-500 hover:bg-pink-600 text-white text-2xl px-12 py-8 text-xl"
            >
              Yes! 💖
            </Button>
            
            <motion.div
              animate={{
                x: noButtonPosition.x,
                y: noButtonPosition.y,
                scale: noButtonScale,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Button
                onClick={handleNoClick}
                size="lg"
                variant="outline"
                className="text-xl px-12 py-8 border-2 border-gray-400"
              >
                No
              </Button>
            </motion.div>
          </div>
          
          {noClickCount > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-pink-500 mt-6 text-lg"
            >
              Aww come on, you know you want to say yes! 🥺
            </motion.p>
          )}
        </motion.div>
      </div>
    );
  }

  // Render Final Stage
  if (stage === 'final') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-6 p-4 md:p-8 min-h-screen text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 150, delay: 0.2 }}
        >
          <Heart className="size-24 md:size-32 text-pink-500 mx-auto mb-6 animate-pulse" />
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h1 className="text-3xl md:text-5xl font-bold text-pink-600">
            Congratulations! 🎉
          </h1>
          
          <div className="bg-white/80 backdrop-blur p-8 rounded-lg shadow-xl max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl text-gray-800 leading-relaxed">
              You won an exclusive Valentines date with Rem(Adi), Happy Valentines and see you soon! I love you😘
            </p>
          </div>

          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            className="text-6xl md:text-8xl mt-6"
          >
            ❤️💕💖
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  return null;
}