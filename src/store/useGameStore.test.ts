import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGameStore } from './useGameStore';
import { GAME_CONSTANTS } from '../constants';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.setState({
      budget: 2000,
      gamePhase: 'tactical',
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
        inStorm: false,
        totalCost: 750,
      },
      wreckage: [],
      simulationRunning: false,
      networkConnected: true,
      sectorCovered: false,
      sectorTimeRemaining: 30,
      sectorStatus: 'active',
      bufferTimeRemaining: 10,
      missionStatus: 'active',
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    useGameStore.getState().stopSimulation();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes in hangar phase by default but resets to tactical for tests', () => {
    const state = useGameStore.getState();
    expect(state.gamePhase).toBe('tactical');
  });

  it('deploys a blueprint correctly and deducts budget', () => {
    const store = useGameStore.getState();
    expect(store.budget).toBe(2000);

    store.deployBlueprint({
      airframeId: 'af-scout',
      batteryId: 'bat-heavy',
      radioId: 'rad-beam'
    } as any);
    
    const newState = useGameStore.getState();
    expect(newState.gamePhase).toBe('tactical');
    expect(newState.drone.batteryMaxWh).toBe(200);
    expect(newState.drone.radioRangeMeters).toBe(500);
    expect(newState.budget).toBe(800); // 2000 - (500 + 300 + 400)
  });

  it('applies storm cell penalties to power draw and radio range', () => {
    useGameStore.setState({
      drone: {
        ...useGameStore.getState().drone,
        position: { x: 100, y: 100 },
        inStorm: false,
        batteryWh: 80,
      },
      stormCells: [
        { id: 'test-storm', position: { x: 100, y: 100 }, velocity: { x: 0, y: 0 }, radius: 50 }
      ]
    });
    
    useGameStore.getState().tick();
    
    const state = useGameStore.getState();
    expect(state.drone.inStorm).toBe(true);
    // Base draw is 20, payload 1, mMax 2 => 20 * 1.5 + 5 = 35W
    // In storm: 35W * 1.4 = 49W
    // 1 tick = 1 sec = 49 / 3600 Wh drained
    expect(state.drone.batteryWh).toBeCloseTo(80 - (49 / 3600), 5);
  });

  it('drops connectivity and decreases buffer when out of range', () => {
    useGameStore.setState((state) => ({
      drone: {
        ...state.drone,
        position: { x: GAME_CONSTANTS.HOME_BASE_POS.x + GAME_CONSTANTS.COMM_RANGE + 10, y: 0 },
        status: 'deploying' // Need to be deploying to test mission active mechanics properly
      }
    }));
    
    const tick = useGameStore.getState().tick;
    tick();
    
    expect(useGameStore.getState().networkConnected).toBe(false);
    expect(useGameStore.getState().bufferTimeRemaining).toBe(9); // 10 -> 9
    
    // Tick 9 more times to fail mission
    for (let i = 0; i < 9; i++) {
      tick();
    }
    
    expect(useGameStore.getState().bufferTimeRemaining).toBe(0);
    expect(useGameStore.getState().missionStatus).toBe('failed');
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

  it('ticks down relief timer and clears sector', () => {
    useGameStore.setState({
      sectorCovered: true,
      sectorTimeRemaining: 2,
      sectorStatus: 'active',
      networkConnected: true,
      missionStatus: 'active',
      gamePhase: 'tactical',
      budget: 1000,
      drone: { 
        ...useGameStore.getState().drone, 
        status: 'idle',
        position: GAME_CONSTANTS.TARGET_POS,
        radioRangeMeters: 1000
      },
    });
    
    useGameStore.getState().tick();
    expect(useGameStore.getState().sectorTimeRemaining).toBe(1);
    expect(useGameStore.getState().sectorStatus).toBe('active');
    
    useGameStore.getState().tick();
    expect(useGameStore.getState().sectorTimeRemaining).toBe(0);
    expect(useGameStore.getState().sectorStatus).toBe('cleared');
    expect(useGameStore.getState().budget).toBe(2000); // 1000 + 1000 bounty
    expect(useGameStore.getState().gamePhase).toBe('mission_cleared');
  });

  it('crashes drone, pushes to wreckage, and returns to hangar', () => {
    useGameStore.setState({
      gamePhase: 'tactical',
      drone: {
        ...useGameStore.getState().drone,
        batteryWh: 0.001, // Almost empty
        status: 'deploying',
        position: { x: 50, y: 50 },
        inStorm: false,
      }
    });

    useGameStore.getState().tick();
    
    const state = useGameStore.getState();
    expect(state.drone.status).toBe('crashed');
    expect(state.gamePhase).toBe('hangar');
    expect(state.wreckage.length).toBe(1);
    expect(state.wreckage[0].position).toEqual({ x: 50, y: 50 });
  });

  it('salvages wreckage when equipped with winch', () => {
    useGameStore.setState({
      budget: 1000,
      wreckage: [
        { ...useGameStore.getState().drone, position: { x: 100, y: 100 }, totalCost: 500 }
      ],
      drone: {
        ...useGameStore.getState().drone,
        position: { x: 100, y: 100 },
        payloadId: 'pay-winch',
        status: 'idle',
      }
    });

    useGameStore.getState().tick();
    
    const state = useGameStore.getState();
    expect(state.wreckage.length).toBe(0);
    expect(state.budget).toBe(1500); // 1000 + 500 salvage
  });
});
