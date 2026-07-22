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
  status: 'idle' | 'deploying';
}

interface GameState {
  drone: Drone;
  launchDrone: () => void;
  resolveDeployment: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  drone: {
    id: 'scout-1',
    position: GAME_CONSTANTS.HOME_BASE_POS,
    targetPosition: null,
    status: 'idle',
  },
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
}));
