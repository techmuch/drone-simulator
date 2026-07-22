import { describe, it, expect } from 'vitest';
import { useGameStore } from './useGameStore';

describe('useGameStore', () => {
  it('initializes with a drone at home base', () => {
    const state = useGameStore.getState();
    expect(state.drone.status).toBe('idle');
    expect(state.drone.position).toEqual({ x: 100, y: 500 });
    expect(state.drone.targetPosition).toBeNull();
  });

  it('updates state when launchDrone is called', () => {
    const store = useGameStore.getState();
    store.launchDrone();

    const updatedState = useGameStore.getState();
    expect(updatedState.drone.status).toBe('deploying');
    expect(updatedState.drone.targetPosition).toEqual({ x: 600, y: 100 });
  });
});
