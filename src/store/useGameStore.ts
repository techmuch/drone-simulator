import { create } from 'zustand';
import { GAME_CONSTANTS } from '../constants';

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
}

interface GameState {
  drone: Drone;
  simulationRunning: boolean;
  launchDrone: () => void;
  resolveDeployment: () => void;
  tick: () => void;
  startSimulation: () => void;
  stopSimulation: () => void;
}

let tickInterval: ReturnType<typeof setInterval> | null = null;

export const useGameStore = create<GameState>((set, get) => ({
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
  },
  simulationRunning: false,
  launchDrone: () =>
    set((state) => ({
      drone: {
        ...state.drone,
        status: 'deploying',
        targetPosition: GAME_CONSTANTS.TARGET_POS,
      },
    })),
  resolveDeployment: () =>
    set((state) => ({
      drone: {
        ...state.drone,
        status: 'idle',
        position: state.drone.targetPosition || state.drone.position,
        targetPosition: null,
      },
    })),
  tick: () =>
    set((state) => {
      const drone = state.drone;
      if (drone.status === 'crashed') return state;

      // P_total = P_base * (1 + m_payload / m_max) + P_radio
      const pTotal = drone.pBase * (1 + drone.mPayload / drone.mMax) + drone.pRadio;
      const drainWh = pTotal / 3600; // Wh consumed in 1 second
      
      const newBattery = Math.max(0, drone.batteryWh - drainWh);
      
      // If we're flying but run out of battery, crash.
      // If we're idle at base, maybe we recharge, but for now we just don't crash.
      const newStatus = (newBattery === 0 && drone.status === 'deploying') ? 'crashed' : drone.status;

      return {
        drone: {
          ...drone,
          batteryWh: newBattery,
          status: newStatus
        }
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
