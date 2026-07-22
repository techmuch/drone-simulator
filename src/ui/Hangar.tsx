import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { AIRFRAMES, BATTERIES, RADIOS, PAYLOADS } from '../game/parts';
import type { ComponentPart } from '../game/parts';
import { compileBlueprint } from '../game/parts';
import { calculateSpeed, calculatePowerDraw, calculateFlightTimeSec } from '../game/physics';

// Reusable part selector component
function PartSelector({ 
  label, 
  parts, 
  selectedId, 
  onSelect,
  renderSpecs 
}: { 
  label: string, 
  parts: ComponentPart[], 
  selectedId: string, 
  onSelect: (id: string) => void,
  renderSpecs: (part: ComponentPart) => string
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-neutral-400">{label}</label>
      <div className="flex gap-2">
        {parts.map(p => (
          <button 
            key={p.id} 
            onClick={() => onSelect(p.id)}
            className={`p-4 flex-1 text-left border rounded transition-colors ${selectedId === p.id ? 'border-green-500 bg-green-900/20' : 'border-neutral-600 hover:bg-neutral-700'}`}
          >
            <div className="flex justify-between">
              <span className="font-bold">{p.name}</span>
              <span className="text-green-400 font-mono">${p.cost}</span>
            </div>
            <div className="text-xs text-neutral-400 mt-1">{renderSpecs(p)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Hangar() {
  const deployBlueprint = useGameStore((state) => state.deployBlueprint);
  const budget = useGameStore((state) => state.budget);

  const [airframeId, setAirframeId] = useState(AIRFRAMES[0].id);
  const [batteryId, setBatteryId] = useState(BATTERIES[0].id);
  const [radioId, setRadioId] = useState(RADIOS[0].id);
  const [payloadId, setPayloadId] = useState(PAYLOADS[0].id);

  const stats = compileBlueprint({ airframeId, batteryId, radioId, auxPayloadId: payloadId });
  if (!stats) return null;

  const mockDrone = { ...stats } as any;

  const isOverweight = stats.mPayload > stats.mMax;
  const isUnaffordable = stats.totalCost > budget;
  
  const speed = isOverweight ? 0 : calculateSpeed(mockDrone);
  const powerDraw = calculatePowerDraw(mockDrone);
  const flightTimeSec = isOverweight ? 0 : calculateFlightTimeSec(mockDrone);

  const handleDeploy = () => {
    if (isUnaffordable) return;
    deployBlueprint({
      id: `custom-${Date.now()}`,
      name: 'Custom Drone',
      airframeId,
      batteryId,
      radioId,
      auxPayloadId: payloadId,
    });
  };

  return (
    <div className="absolute inset-0 bg-neutral-900 z-50 text-neutral-100 flex p-8 gap-8">
      {/* Left Column: Procurement */}
      <div className="flex-1 flex flex-col gap-6 max-w-2xl border border-neutral-700 bg-neutral-800 p-6 rounded shadow-xl">
        <div className="flex justify-between items-center border-b border-neutral-600 pb-4">
          <h1 className="text-3xl font-bold">HANGAR: PROCUREMENT & LOADOUT</h1>
          <div className="text-2xl font-mono text-green-400 font-bold">
            BUDGET: ${budget}
          </div>
        </div>
        
        <PartSelector 
          label="AIRFRAME" 
          parts={AIRFRAMES} 
          selectedId={airframeId} 
          onSelect={setAirframeId}
          renderSpecs={(p) => `Max Payload: ${p.specs.maxPayloadKg}kg | Base Draw: ${p.specs.basePowerDrawW}W`}
        />

        <PartSelector 
          label="BATTERY" 
          parts={BATTERIES} 
          selectedId={batteryId} 
          onSelect={setBatteryId}
          renderSpecs={(p) => `Capacity: ${p.specs.capacityWh}Wh | Mass: ${p.massKg}kg`}
        />

        <PartSelector 
          label="RADIO MODULE" 
          parts={RADIOS} 
          selectedId={radioId} 
          onSelect={setRadioId}
          renderSpecs={(p) => `Range: ${p.specs.radioRangeMeters}m | Mass: ${p.massKg}kg`}
        />

        <PartSelector 
          label="PAYLOAD" 
          parts={PAYLOADS} 
          selectedId={payloadId} 
          onSelect={setPayloadId}
          renderSpecs={(p) => p.id === 'pay-none' ? 'No extra payload' : `Mass: ${p.massKg}kg`}
        />
      </div>

      {/* Right Column: Simulation Predictor */}
      <div className="w-96 border border-blue-900/50 bg-black/80 p-6 rounded shadow-xl flex flex-col justify-between font-mono">
        <div>
          <h2 className="text-xl font-bold text-blue-400 border-b border-blue-900/50 pb-2 mb-6">SIMULATION PREDICTOR</h2>
          
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">TOTAL COST</span>
              <span className={`font-bold ${isUnaffordable ? 'text-red-500' : 'text-green-400'}`}>
                ${stats.totalCost}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-400">PAYLOAD MASS</span>
              <span className={`font-bold ${isOverweight ? 'text-orange-500' : 'text-neutral-100'}`}>
                {stats.mPayload.toFixed(1)} / {stats.mMax.toFixed(1)} kg
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
              <span className="font-bold text-green-400">{stats.radioRangeMeters} m</span>
            </div>
          </div>
        </div>

        <div>
          {isOverweight && (
            <div className="text-orange-500 text-sm font-bold text-center mb-4">
              WARNING: OVERWEIGHT CHASSIS
            </div>
          )}
          {isUnaffordable && (
            <div className="text-red-500 text-sm font-bold text-center mb-4 animate-pulse">
              INSUFFICIENT FUNDS
            </div>
          )}
          <button 
            onClick={handleDeploy}
            disabled={isUnaffordable}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-4 rounded shadow-lg transition-colors border border-blue-400/30"
          >
            DEPLOY TO TACTICAL MAP
          </button>
        </div>
      </div>
    </div>
  );
}
