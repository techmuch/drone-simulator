import { create } from 'zustand';

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
}

export const useGameStore = create<GameState>((set) => ({
  drone: {
    id: 'scout-1',
    position: { x: 100, y: 500 }, // Home base position
    targetPosition: null,
    status: 'idle',
  },
  launchDrone: () =>
    set((state) => ({
      drone: {
        ...state.drone,
        status: 'deploying',
        targetPosition: { x: 600, y: 100 }, // Target disaster zone
      },
    })),
}));
