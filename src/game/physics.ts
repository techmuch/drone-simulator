import type { Drone } from '../store/useGameStore';
import { GAME_CONSTANTS } from '../constants';

export const calculateSpeed = (drone: Drone): number => {
  return drone.vMax * (1 - 0.5 * drone.mPayload / drone.mMax);
};

export const calculatePowerDraw = (drone: Drone): number => {
  return drone.pBase * (1 + drone.mPayload / drone.mMax) + drone.pRadio;
};

export const getDistance = (p1: { x: number, y: number }, p2: { x: number, y: number }): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const calculateBingoWh = (drone: Drone): number => {
  const distanceToHome = getDistance(drone.position, GAME_CONSTANTS.HOME_BASE_POS);
  
  const timeToHomeSec = distanceToHome / calculateSpeed(drone);
  const bingoTimeSec = timeToHomeSec + GAME_CONSTANTS.BINGO_MARGIN_SEC;
  return (bingoTimeSec * calculatePowerDraw(drone)) / 3600;
};
