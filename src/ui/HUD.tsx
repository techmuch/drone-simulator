import { useGameStore } from '../store/useGameStore';
import { calculatePowerDraw, calculateBingoWh } from '../game/physics';

export function HUD() {
  const drone = useGameStore((state) => state.drone);
  const launchDrone = useGameStore((state) => state.launchDrone);

  // Math from Physics module
  const pTotal = calculatePowerDraw(drone);
  const bingoWh = calculateBingoWh(drone);

  const isBingo = drone.batteryWh <= bingoWh;
  const batteryPercent = (drone.batteryWh / drone.batteryMaxWh) * 100;
  
  const statusColor = drone.status === 'crashed' ? 'text-red-500' : 'text-green-500';

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Bar HUD */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/80 border border-green-900/50 p-4 rounded text-green-400 font-mono text-sm shadow-xl min-w-[250px]">
          <h2 className="font-bold border-b border-green-900/50 pb-2 mb-2">DRONE COMMAND</h2>
          <div className="flex justify-between mb-1">
            <span>STATUS:</span>
            <span className={`font-bold ${statusColor}`}>{drone.status.toUpperCase()}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>DRAIN:</span>
            <span>{pTotal.toFixed(1)} W</span>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span>BATTERY</span>
              <span>{drone.batteryWh.toFixed(1)} Wh</span>
            </div>
            <div className="w-full bg-gray-800 h-2 rounded overflow-hidden relative">
              <div 
                className={`h-full ${isBingo ? 'bg-red-500 animate-pulse' : 'bg-green-500'} transition-all`}
                style={{ width: `${Math.max(0, batteryPercent)}%` }}
              ></div>
              {/* Bingo Marker */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-yellow-400 opacity-80"
                style={{ left: `${(bingoWh / drone.batteryMaxWh) * 100}%` }}
              ></div>
            </div>
            {drone.inStorm && (
              <div className="mt-2 text-xs font-bold text-red-400 animate-pulse bg-red-900/30 p-1 rounded text-center border border-red-500/50">
                ⚠ WEATHER WARNING: -40% EFFICIENCY ⚠
              </div>
            )}
            {isBingo && drone.status !== 'crashed' && (
              <div className="text-red-500 text-xs font-bold mt-1 text-center animate-pulse">
                BINGO FUEL - CRITICAL
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex justify-end pointer-events-auto">
        <button 
          onClick={launchDrone}
          disabled={drone.status !== 'idle'}
          className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-3 px-6 rounded shadow-lg shadow-green-900/50 transition-colors border border-green-400/30"
        >
          {drone.status === 'idle' ? 'LAUNCH DRONE' : (drone.status === 'crashed' ? 'SYSTEM OFFLINE' : 'DEPLOYING...')}
        </button>
      </div>
    </div>
  );
}
