/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music, 
  Trophy, 
  Gamepad2, 
  Zap,
  Volume2,
  RefreshCcw,
  Activity,
  Cpu,
  Terminal,
  ChevronRight
} from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const BASE_SPEED = 150;

type Point = { x: number; y: number };

const TRACKS = [
  {
    id: 1,
    title: "CYBER_DRIFT.mp3",
    artist: "AI UNIT 01",
    duration: "03:45",
    cover: "from-[#00f3ff] to-[#ff00ff]",
    bpm: "128"
  },
  {
    id: 2,
    title: "NEON_PULSE.wav",
    artist: "AI UNIT 02",
    duration: "04:20",
    cover: "from-[#ff00ff] to-[#39ff14]",
    bpm: "140"
  },
  {
    id: 3,
    title: "VOID_ECHO.flac",
    artist: "AI UNIT 03",
    duration: "02:55",
    cover: "from-[#39ff14] to-[#00f3ff]",
    bpm: "115"
  }
];

// --- Snake Game Component ---
const SnakeGame = ({ onScoreChange, isGameOver }: { onScoreChange: (score: number) => void, isGameOver: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);
  
  const lastMoveTime = useRef<number>(0);
  const directionQueue = useRef<Point>(INITIAL_DIRECTION);

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const isOccupied = currentSnake.some(p => p.x === newFood.x && p.y === newFood.y);
      if (!isOccupied) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionQueue.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setGameOver(false);
    setScore(0);
    onScoreChange(0);
    setIsPaused(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
          if (direction.y === 0) directionQueue.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
          if (direction.y === 0) directionQueue.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
          if (direction.x === 0) directionQueue.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
          if (direction.x === 0) directionQueue.current = { x: 1, y: 0 };
          break;
        case ' ':
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const currentDir = directionQueue.current;
      setDirection(currentDir);
      
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + currentDir.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + currentDir.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some(p => p.x === newHead.x && p.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 10;
        setScore(newScore);
        onScoreChange(newScore);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, isPaused, score, onScoreChange, generateFood]);

  useEffect(() => {
    const gameLoop = (time: number) => {
      const speed = Math.max(60, BASE_SPEED - Math.floor(score / 50) * 10);
      if (time - lastMoveTime.current > speed) {
        moveSnake();
        lastMoveTime.current = time;
      }
      requestAnimationFrame(gameLoop);
    };

    const requestId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestId);
  }, [moveSnake, score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width / GRID_SIZE;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * size, 0);
        ctx.lineTo(i * size, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * size);
        ctx.lineTo(canvas.width, i * size);
        ctx.stroke();
    }

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(food.x * size + 2, food.y * size + 2, size - 4, size - 4);

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#39ff14';
    snake.forEach((p, i) => {
      if (i === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(p.x * size + 1, p.y * size + 1, size - 2, size - 2);
      } else {
        const alpha = 1 - (i / snake.length) * 0.7;
        ctx.fillStyle = `rgba(57, 255, 20, ${alpha})`;
        ctx.fillRect(p.x * size + 2, p.y * size + 2, size - 4, size - 4);
      }
    });

    ctx.shadowBlur = 0;
  }, [snake, food]);

  return (
    <div className="relative border-4 border-cyber-border bg-black shadow-[0_0_40px_rgba(0,243,255,0.1)]">
      <canvas 
        ref={canvasRef} 
        width={500} 
        height={500} 
        className="w-[500px] h-[500px]"
      />
      
      <AnimatePresence>
        {isPaused && !gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center pointer-events-none"
          >
            <Gamepad2 className="w-16 h-16 text-cyber-cyan mb-4 animate-pulse duration-[2000ms]" />
            <h2 className="text-xl font-black tracking-[0.3em] uppercase">SYSTEM_READY</h2>
            <p className="text-cyber-cyan/40 text-[10px] mt-2">PRESS WASD OR SPACE</p>
          </motion.div>
        )}

        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-16 h-16 bg-cyber-pink shadow-[0_0_20px_#ff00ff] flex items-center justify-center mb-6">
                <Zap className="w-10 h-10 text-black fill-current" />
            </div>
            <h2 className="text-3xl font-black tracking-tighter uppercase mb-2 text-cyber-pink neon-shadow-pink">Session Terminated</h2>
            <div className="flex flex-col gap-1 items-center mb-10">
                <span className="text-[10px] uppercase opacity-40">Final Calculation</span>
                <span className="text-4xl text-cyber-cyan font-bold">{score.toString().padStart(5, '0')}</span>
            </div>
            <button 
              onClick={resetGame}
              className="px-10 py-4 bg-cyber-cyan text-black font-black uppercase tracking-tighter hover:bg-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(0,243,255,0.4)]"
            >
              <RefreshCcw className="w-5 h-5" />
              Re-initialize
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [systemLogs, setSystemLogs] = useState<string[]>(['SNAKE_CORE_INIT_OK', 'READY_FOR_INPUT']);

  useEffect(() => {
    if (score > highScore) setHighScore(score);
    if (score > 0 && score % 50 === 0) {
        setSystemLogs(prev => [`BONUS_THRESHOLD_MET: ${score}`, ...prev.slice(0, 4)]);
    }
  }, [score, highScore]);

  const handleNextTrack = () => setCurrentTrackIndex(prev => (prev + 1) % TRACKS.length);
  const handlePrevTrack = () => setCurrentTrackIndex(prev => (prev - 1 + TRACKS.length) % TRACKS.length);

  return (
    <div className="w-screen h-screen flex flex-col bg-cyber-bg border-4 border-[#1a1a1a] select-none">
      <div className="scanline fixed inset-0 z-50 pointer-events-none opacity-10" />
      
      {/* Header */}
      <header className="h-20 border-b border-cyber-border flex items-center justify-between px-10 bg-cyber-header">
        <div className="flex items-center gap-5">
          <div className="w-10 h-10 bg-cyber-cyan shadow-neon-shadow-cyan flex items-center justify-center">
            <div className="w-5 h-5 bg-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">Neon Synth // Snake</h1>
            <span className="text-[10px] opacity-40 uppercase tracking-[0.2em]">Quantum Entertainment Terminal</span>
          </div>
        </div>

        <div className="flex gap-16">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase opacity-40 font-bold">Current Payload</span>
            <span className="text-3xl font-black text-cyber-green neon-shadow-green">{score.toString().padStart(5, '0')}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase opacity-40 font-bold">Peak Score</span>
            <span className="text-3xl font-black text-cyber-pink neon-shadow-pink">{highScore.toString().padStart(5, '0')}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Audio Stream */}
        <aside className="w-80 border-r border-cyber-border p-8 flex flex-col gap-8 bg-[#080808]">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-6">
                <Music className="w-4 h-4" />
                <h2 className="text-xs font-black uppercase tracking-widest opacity-50">Audio Channels</h2>
            </div>
            
            <div className="space-y-3">
              {TRACKS.map((track, idx) => (
                <div 
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`p-4 transition-all cursor-pointer group ${
                    currentTrackIndex === idx 
                      ? 'bg-cyber-cyan/10 border-l-2 border-cyber-cyan' 
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${track.cover} ${currentTrackIndex === idx ? 'opacity-100 shadow-[0_0_10px_rgba(0,243,255,0.3)]' : 'opacity-40'}`} />
                    <div className="flex flex-col overflow-hidden">
                      <span className={`text-[12px] font-bold truncate ${currentTrackIndex === idx ? 'text-cyber-cyan' : 'text-white/60'}`}>{track.title}</span>
                      <span className="text-[10px] opacity-40 uppercase tracking-tighter truncate">{track.artist}</span>
                    </div>
                    {currentTrackIndex === idx && idx === currentTrackIndex && isPlaying && (
                        <div className="ml-auto flex gap-1 h-3 items-end">
                            <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-cyber-cyan" />
                            <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-cyber-cyan" />
                            <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1 bg-cyber-cyan" />
                        </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border border-cyber-border bg-cyber-cyan/5 text-center">
            <span className="text-[10px] uppercase font-bold block mb-3 text-white/60">Logic Processing</span>
            <div className="flex justify-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 ${score > 10 ? 'bg-cyber-cyan neon-shadow-cyan' : 'bg-white/10'}`} />
                <div className={`w-2.5 h-2.5 ${score > 50 ? 'bg-cyber-cyan neon-shadow-cyan' : 'bg-white/10'}`} />
                <div className={`w-2.5 h-2.5 ${score > 100 ? 'bg-cyber-cyan neon-shadow-cyan' : 'bg-white/10'}`} />
                <div className={`w-2.5 h-2.5 ${score > 200 ? 'bg-cyber-cyan neon-shadow-cyan' : 'bg-white/10'}`} />
            </div>
            <span className="text-[10px] opacity-40 font-bold block tracking-widest">LAYER_{Math.floor(score / 50).toString().padStart(2, '0')}</span>
          </div>
        </aside>

        {/* Center: Game Panel */}
        <section className="flex-1 relative grid-bg flex items-center justify-center p-8 bg-black/40">
           <SnakeGame onScoreChange={setScore} isGameOver={false} />
        </section>

        {/* Right Sidebar: System Stats */}
        <aside className="w-72 border-l border-cyber-border p-8 flex flex-col gap-8 bg-[#080808]">
          <div>
            <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4" />
                <h2 className="text-xs font-black uppercase tracking-widest opacity-50">System Link</h2>
            </div>
            
            <div className="space-y-5">
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-bold text-white/40">LATENCY_MS</span>
                <span className="text-xs font-mono text-white group-hover:text-cyber-cyan transition-colors">4.82 ms</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-bold text-white/40">CORE_VER</span>
                <span className="text-xs font-mono text-white group-hover:text-cyber-cyan transition-colors">0.42.0</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-bold text-white/40">PKT_LOSS</span>
                <span className="text-xs font-mono text-cyber-green group-hover:text-cyber-cyan transition-colors">NIL</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-[10px] font-bold text-white/40">ENTROPY</span>
                <span className="text-xs font-mono text-white group-hover:text-cyber-cyan transition-colors uppercase">Synchronized</span>
              </div>
            </div>
            
            <div className="h-px bg-cyber-border my-8" />
            
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 opacity-40" />
                    <span className="text-[10px] uppercase font-bold opacity-40">Command_Log</span>
                </div>
                <div className="text-[10px] font-mono leading-relaxed space-y-2">
                    {systemLogs.map((log, i) => (
                        <div key={i} className="flex gap-2">
                            <ChevronRight className="w-2 h-2 text-cyber-cyan mt-1" />
                            <span className={i === 0 ? 'text-cyber-cyan' : 'opacity-40'}>{log}</span>
                        </div>
                    ))}
                    <div className="flex gap-2 animate-pulse">
                        <ChevronRight className="w-2 h-2 text-cyber-cyan mt-1" />
                        <span className="text-cyber-cyan">_WAITING...</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="mt-auto opacity-10 flex flex-col gap-2 scale-75 origin-bottom">
            <Cpu className="w-12 h-12" />
            <p className="text-[8px] leading-[1.2]">BIO_DIGITAL_ENGINE_CO<br/>ALL_RIGHTS_STRIPPED</p>
          </div>
        </aside>
      </main>

      {/* Footer: Global Music Controls */}
      <footer className="h-28 border-t border-cyber-border bg-cyber-header flex items-center px-12 gap-12">
        <div className="flex items-center gap-8">
          <button onClick={handlePrevTrack} className="text-white/40 hover:text-white transition-colors">
            <SkipBack className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 bg-white text-black flex items-center justify-center hover:bg-cyber-cyan transition-all neon-shadow-cyan"
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 ml-1 fill-current" />}
          </button>
          <button onClick={handleNextTrack} className="text-white/40 hover:text-white transition-colors">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="flex justify-between text-[11px] font-black tracking-widest uppercase items-center">
            <span className="flex items-center gap-2">
                <span className="text-cyber-cyan">Now Streaming:</span> 
                {TRACKS[currentTrackIndex].title} ({TRACKS[currentTrackIndex].bpm} BPM)
            </span>
            <span className="opacity-40">
                {isPlaying ? '01:45' : '暂停'} / {TRACKS[currentTrackIndex].duration}
            </span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-none relative overflow-hidden">
            <motion.div 
              animate={{ width: isPlaying ? '100%' : '45%' }}
              transition={{ duration: isPlaying ? 100 : 0.3, repeat: isPlaying ? Infinity : 0 }}
              className="h-full bg-cyber-cyan shadow-[0_0_10px_#00f3ff]" 
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Volume2 className="w-5 h-5 text-cyber-cyan" />
          <div className="w-32 h-1 bg-[#1a1a1a]">
            <div className="h-full bg-white opacity-40" style={{ width: '80%' }} />
          </div>
        </div>
      </footer>
    </div>
  );
}
