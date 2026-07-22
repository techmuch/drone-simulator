import type { Drone, Vector2D } from '../store/useGameStore';
import { GAME_CONSTANTS } from '../constants';

export const calculateSpeed = (drone: Drone): number => {
  return drone.vMax * (1 - 0.5 * drone.mPayload / drone.mMax);
};

export const calculatePowerDraw = (drone: Drone): number => {
  const baseDraw = drone.pBase * (1 + drone.mPayload / drone.mMax) + drone.pRadio;
  return drone.inStorm ? baseDraw * 1.4 : baseDraw;
};

export const getDistance = (p1: Vector2D, p2: Vector2D): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const calculateBingoWh = (drone: Drone): number => {
  const distanceToHome = getDistance(drone.position, GAME_CONSTANTS.HOME_BASE_POS);
  
  const timeToHomeSec = distanceToHome / calculateSpeed(drone);
  const bingoTimeSec = timeToHomeSec + GAME_CONSTANTS.BINGO_MARGIN_SEC;
  return calculatePowerDraw(drone) * (bingoTimeSec / 3600);
};

export const calculateFlightTimeSec = (drone: Drone): number => {
  const powerDraw = calculatePowerDraw(drone);
  if (powerDraw === 0) return 0;
  return (drone.batteryMaxWh / powerDraw) * 3600;
};
