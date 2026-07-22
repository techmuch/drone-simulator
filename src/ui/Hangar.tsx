import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { AIRFRAMES, BATTERIES, RADIOS } from '../game/parts';
import type { DroneBlueprint } from '../game/parts';
import { calculateSpeed, calculatePowerDraw } from '../game/physics';

export function Hangar() {
  const deployBlueprint = useGameStore((state) => state.deployBlueprint);

  const [airframeId, setAirframeId] = useState(AIRFRAMES[0].id);
  const [batteryId, setBatteryId] = useState(BATTERIES[0].id);
  const [radioId, setRadioId] = useState(RADIOS[0].id);

  // Compute predictor stats
  const airframe = AIRFRAMES.find(a => a.id === airframeId)!;
  const battery = BATTERIES.find(b => b.id === batteryId)!;
  const radio = RADIOS.find(r => r.id === radioId)!;

  const totalMassKg = battery.massKg + radio.massKg;
  
  // Create a mock drone to use physics calculations
  const mockDrone = {
    pBase: airframe.specs.basePowerDrawW!,
    pRadio: radio.specs.basePowerDrawW!,
    mPayload: totalMassKg,
    mMax: airframe.specs.maxPayloadKg!,
    vMax: airframe.specs.maxSpeedMs!,
  };

  const isOverweight = totalMassKg > mockDrone.mMax;
  
  const speed = isOverweight ? 0 : calculateSpeed(mockDrone as any);
  const powerDraw = calculatePowerDraw(mockDrone as any);
  const flightTimeSec = isOverweight ? 0 : (battery.specs.capacityWh! / powerDraw) * 3600;

  const handleDeploy = () => {
    if (isOverweight) return;
    const blueprint: DroneBlueprint = {
      id: `custom-${Date.now()}`,
      name: 'Custom Drone',
      airframeId,
      batteryId,
      radioId,
    };
    deployBlueprint(blueprint);
  };

  return (
    <div className="absolute inset-0 bg-neutral-900 z-50 text-neutral-100 flex p-8 gap-8">
      {/* Left Column: Procurement */}
      <div className="flex-1 flex flex-col gap-6 max-w-2xl border border-neutral-700 bg-neutral-800 p-6 rounded shadow-xl">
        <h1 className="text-3xl font-bold border-b border-neutral-600 pb-4">HANGAR: PROCUREMENT & LOADOUT</h1>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-neutral-400">AIRFRAME</label>
          <div className="flex gap-2">
            {AIRFRAMES.map(a => (
              <button 
                key={a.id} 
                onClick={() => setAirframeId(a.id)}
                className={`p-4 flex-1 text-left border rounded transition-colors ${airframeId === a.id ? 'border-green-500 bg-green-900/20' : 'border-neutral-600 hover:bg-neutral-700'}`}
              >
                <div className="font-bold">{a.name}</div>
                <div className="text-xs text-neutral-400">Max Payload: {a.specs.maxPayloadKg}kg | Base Draw: {a.specs.basePowerDrawW}W</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-neutral-400">BATTERY</label>
          <div className="flex gap-2">
            {BATTERIES.map(b => (
              <button 
                key={b.id} 
                onClick={() => setBatteryId(b.id)}
                className={`p-4 flex-1 text-left border rounded transition-colors ${batteryId === b.id ? 'border-green-500 bg-green-900/20' : 'border-neutral-600 hover:bg-neutral-700'}`}
              >
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-neutral-400">Capacity: {b.specs.capacityWh}Wh | Mass: {b.massKg}kg</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-neutral-400">RADIO MODULE</label>
          <div className="flex gap-2">
            {RADIOS.map(r => (
              <button 
                key={r.id} 
                onClick={() => setRadioId(r.id)}
                className={`p-4 flex-1 text-left border rounded transition-colors ${radioId === r.id ? 'border-green-500 bg-green-900/20' : 'border-neutral-600 hover:bg-neutral-700'}`}
              >
                <div className="font-bold">{r.name}</div>
                <div className="text-xs text-neutral-400">Range: {r.specs.radioRangeMeters}m | Mass: {r.massKg}kg</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Simulation Predictor */}
      <div className="w-96 border border-blue-900/50 bg-black/80 p-6 rounded shadow-xl flex flex-col justify-between font-mono">
        <div>
          <h2 className="text-xl font-bold text-blue-400 border-b border-blue-900/50 pb-2 mb-6">SIMULATION PREDICTOR</h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">PAYLOAD MASS</span>
              <span className={`font-bold ${isOverweight ? 'text-red-500' : 'text-neutral-100'}`}>
                {totalMassKg.toFixed(1)} / {mockDrone.mMax.toFixed(1)} kg
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-neutral-400">MAX SPEED</span>
              <span className="font-bold">{speed.toFixed(1)} m/s</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-neutral-400">TOTAL POWER DRAW</span>
              <span className="font-bold">{powerDraw.toFixed(1)} W</span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-400">ESTIMATED FLIGHT TIME</span>
              <span className="font-bold">{Math.floor(flightTimeSec / 60)}m {Math.floor(flightTimeSec % 60)}s</span>
            </div>

            <div className="flex justify-between border-t border-neutral-800 pt-4 mt-4">
              <span className="text-neutral-400">NETWORK RANGE</span>
              <span className="font-bold text-green-400">{radio.specs.radioRangeMeters} m</span>
            </div>
          </div>
        </div>

        <div>
          {isOverweight && (
            <div className="text-red-500 text-sm font-bold text-center mb-4 animate-pulse">
              CRITICAL: OVERWEIGHT CHASSIS
            </div>
          )}
          <button 
            onClick={handleDeploy}
            disabled={isOverweight}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-4 rounded shadow-lg transition-colors border border-blue-400/30"
          >
            DEPLOY TO TACTICAL MAP
          </button>
        </div>
      </div>
    </div>
  );
}
