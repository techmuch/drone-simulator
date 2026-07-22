import { useEffect } from 'react';
import { PhaserGame } from './game/PhaserGame';
import { HUD } from './ui/HUD';
import { GAME_CONSTANTS } from './constants';
import { useGameStore } from './store/useGameStore';

function App() {
  const startSimulation = useGameStore((state) => state.startSimulation);
  const stopSimulation = useGameStore((state) => state.stopSimulation);

  useEffect(() => {
    startSimulation();
    return () => stopSimulation();
  }, [startSimulation, stopSimulation]);

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans">
      <div 
        className="relative shadow-2xl border border-neutral-800 rounded overflow-hidden"
        style={{ width: GAME_CONSTANTS.CANVAS_WIDTH, height: GAME_CONSTANTS.CANVAS_HEIGHT }}
      >
        <PhaserGame />
        <HUD />
      </div>
    </div>
  );
}

export default App;
