import { useGameStore } from '../store/useGameStore';

export function HUD() {
  const drone = useGameStore((state) => state.drone);
  const launchDrone = useGameStore((state) => state.launchDrone);

  return (
    <div className="absolute top-0 left-0 w-[800px] h-[600px] pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/80 border border-green-900/50 p-4 rounded text-green-500 font-mono text-sm">
          <h1 className="font-bold text-lg text-green-400 mb-2">DRONE SIMULATOR OS</h1>
          <div>MISSION: Restore Sector 4</div>
          <div>STATUS: {drone.status.toUpperCase()}</div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex justify-end pointer-events-auto">
        <button 
          onClick={launchDrone}
          disabled={drone.status !== 'idle'}
          className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-3 px-6 rounded shadow-lg shadow-green-900/50 transition-colors border border-green-400/30"
        >
          {drone.status === 'idle' ? 'LAUNCH DRONE' : 'DEPLOYING...'}
        </button>
      </div>
    </div>
  );
}
