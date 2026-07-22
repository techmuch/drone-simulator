import { describe, it, expect } from 'vitest';
import { useGameStore } from './useGameStore';
import { GAME_CONSTANTS } from '../constants';

describe('useGameStore', () => {
  it('initializes with a drone at home base', () => {
    const state = useGameStore.getState();
    expect(state.drone.status).toBe('idle');
    expect(state.drone.position).toEqual(GAME_CONSTANTS.HOME_BASE_POS);
    expect(state.drone.targetPosition).toBeNull();
  });

  it('updates state when launchDrone is called', () => {
    const store = useGameStore.getState();
    store.launchDrone();

    const updatedState = useGameStore.getState();
    expect(updatedState.drone.status).toBe('deploying');
    expect(updatedState.drone.targetPosition).toEqual(GAME_CONSTANTS.TARGET_POS);
  });

  it('resolves deployment and resets state', () => {
    const store = useGameStore.getState();
    store.resolveDeployment();

    const resolvedState = useGameStore.getState();
    expect(resolvedState.drone.status).toBe('idle');
    expect(resolvedState.drone.position).toEqual(GAME_CONSTANTS.TARGET_POS);
    expect(resolvedState.drone.targetPosition).toBeNull();
  });
});
