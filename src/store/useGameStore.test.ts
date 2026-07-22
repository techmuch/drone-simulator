import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGameStore } from './useGameStore';
import { GAME_CONSTANTS } from '../constants';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
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
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    useGameStore.getState().stopSimulation();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes with a full battery at home base', () => {
    const state = useGameStore.getState();
    expect(state.drone.status).toBe('idle');
    expect(state.drone.batteryWh).toBe(80);
  });

  it('drains battery and moves correctly on each tick', () => {
    const store = useGameStore.getState();
    store.launchDrone(); // deploy
    
    // P_total = 20 * (1 + 1/2) + 5 = 35 W
    // Drain per tick = 35 / 3600 = 0.009722 Wh
    // Speed = 15 * (1 - 0.5 * 1/2) = 11.25 px/s
    store.tick();
    
    const updatedState = useGameStore.getState();
    expect(updatedState.drone.batteryWh).toBeCloseTo(80 - (35 / 3600), 5);
    expect(updatedState.drone.position.x).not.toEqual(GAME_CONSTANTS.HOME_BASE_POS.x); // Should have moved
  });

  it('crashes the drone if battery hits 0 while deployed', () => {
    useGameStore.setState((state) => ({
      drone: {
        ...state.drone,
        status: 'deploying',
        batteryWh: 0.005, // Almost dead
        targetPosition: GAME_CONSTANTS.TARGET_POS
      }
    }));

    const store = useGameStore.getState();
    store.tick(); // Will drain more than 0.005
    
    const finalState = useGameStore.getState();
    expect(finalState.drone.batteryWh).toBe(0);
    expect(finalState.drone.status).toBe('crashed');
  });

  it('starts and stops the simulation loop', () => {
    const store = useGameStore.getState();
    store.startSimulation();
    
    expect(useGameStore.getState().simulationRunning).toBe(true);
    
    vi.advanceTimersByTime(1000); // 1 tick
    
    expect(useGameStore.getState().drone.batteryWh).toBeLessThan(80);
    
    const currentBattery = useGameStore.getState().drone.batteryWh;
    store.stopSimulation();
    
    vi.advanceTimersByTime(2000); // should not tick anymore
    expect(useGameStore.getState().drone.batteryWh).toBe(currentBattery);
  });
});
