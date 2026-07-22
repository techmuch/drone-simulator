import { create } from 'zustand';
import { GAME_CONSTANTS } from '../constants';
import { calculateSpeed, calculatePowerDraw, getDistance } from '../game/physics';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Drone {
  id: string;
  position: Vector2D;
  targetPosition: Vector2D | null;
  status: 'idle' | 'deploying' | 'crashed';
  
  batteryWh: number;
  batteryMaxWh: number;
  pBase: number;
  pRadio: number;
  mPayload: number;
  mMax: number;
  vMax: number;
  radioRangeMeters: number;
}

import type { DroneBlueprint } from '../game/parts';
import { compileBlueprint } from '../game/parts';

interface GameState {
  budget: number;
  gamePhase: 'hangar' | 'tactical';
  drone: Drone;
  simulationRunning: boolean;
  networkConnected: boolean;
  sectorCovered: boolean;
  bufferTimeRemaining: number;
  missionStatus: 'active' | 'failed';
  deployBlueprint: (blueprint: DroneBlueprint) => void;
  launchDrone: () => void;
  tick: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

export const useGameStore = create<GameState>((set, get) => ({
  budget: 2000,
  gamePhase: 'hangar',
  drone: {
    id: 'scout-1',
    position: GAME_CONSTANTS.HOME_BASE_POS,
    targetPosition: null,
    status: 'idle',
    batteryWh: 80,
    batteryMaxWh: 80,
    pBase: 20,
    pRadio: 5,
    mPayload: 1.0,
    mMax: 2.0,
    vMax: 15,
    radioRangeMeters: 200,
  },
  simulationRunning: false,
  networkConnected: true,
  sectorCovered: false,
  bufferTimeRemaining: GAME_CONSTANTS.BUFFER_TIME_SEC,
  missionStatus: 'active',
  deployBlueprint: (blueprint) => {
    const stats = compileBlueprint(blueprint);
    if (!stats) return;

    set((state) => ({
      gamePhase: 'tactical',
      budget: state.budget - stats.totalCost,
      drone: {
        id: blueprint.id,
        position: GAME_CONSTANTS.HOME_BASE_POS,
        targetPosition: null,
        status: 'idle',
        batteryMaxWh: stats.batteryMaxWh,
        batteryWh: stats.batteryMaxWh,
        pBase: stats.pBase,
        pRadio: stats.pRadio,
        mPayload: stats.mPayload,
        mMax: stats.mMax,
        vMax: stats.vMax,
        radioRangeMeters: stats.radioRangeMeters,
      }
    }));
  },
  launchDrone: () =>
    set((state) => ({
      drone: {
        ...state.drone,
        status: 'deploying',
        targetPosition: GAME_CONSTANTS.TARGET_POS,
      },
    })),
  tick: () =>
    set((state) => {
      const drone = state.drone;
      if (drone.status === 'crashed') return state;

      const speed = calculateSpeed(drone);
      const pTotal = calculatePowerDraw(drone);
      const drainWh = pTotal / 3600; // Wh consumed in 1 second
      
      const newBattery = Math.max(0, drone.batteryWh - drainWh);
      
      let newStatus: Drone['status'] = drone.status;
      let newPosition = { ...drone.position };
      let newTarget = drone.targetPosition;

      if (drone.status === 'deploying' && newTarget) {
        // Move drone by speed (px/sec) for this 1 Hz tick
        const dx = newTarget.x - newPosition.x;
        const dy = newTarget.y - newPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= speed) {
          newPosition = newTarget;
          newStatus = 'idle';
          newTarget = null;
        } else {
          newPosition.x += (dx / dist) * speed;
          newPosition.y += (dy / dist) * speed;
        }
      }
      
      // Crash if out of battery while deployed
      if (newBattery === 0 && newStatus === 'deploying') {
        newStatus = 'crashed';
      }

      // Mesh Logic
      const range = drone.radioRangeMeters;
      const droneConnected = getDistance(newPosition, GAME_CONSTANTS.HOME_BASE_POS) <= range;
      const sectorConnected = droneConnected && getDistance(newPosition, GAME_CONSTANTS.TARGET_POS) <= range;
      
      let newBuffer = state.bufferTimeRemaining;
      let newMissionStatus: GameState['missionStatus'] = state.missionStatus;

      const isMeshBroken = !droneConnected;

      if (isMeshBroken) {
        newBuffer = Math.max(0, newBuffer - 1);
        if (newBuffer === 0) {
          newMissionStatus = 'failed';
        }
      } else {
        newBuffer = GAME_CONSTANTS.BUFFER_TIME_SEC;
      }

      return {
        drone: {
          ...drone,
          position: newPosition,
          targetPosition: newTarget,
          batteryWh: newBattery,
          status: newStatus
        },
        networkConnected: droneConnected,
        sectorCovered: sectorConnected,
        bufferTimeRemaining: newBuffer,
        missionStatus: newMissionStatus,
      };
    }),
  startSimulation: () => {
    if (!get().simulationRunning) {
      tickInterval = setInterval(() => get().tick(), GAME_CONSTANTS.TICK_RATE_MS);
      set({ simulationRunning: true });
    }
  },
  stopSimulation: () => {
    if (tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
    }
    set({ simulationRunning: false });
  }
}));
