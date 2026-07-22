import type { Drone } from '../store/useGameStore';
import { GAME_CONSTANTS } from '../constants';

export const calculateSpeed = (drone: Drone): number => {
  return drone.vMax * (1 - 0.5 * drone.mPayload / drone.mMax);
};

export const calculatePowerDraw = (drone: Drone): number => {
  return drone.pBase * (1 + drone.mPayload / drone.mMax) + drone.pRadio;
};

export const calculateBingoWh = (drone: Drone): number => {
  const dx = drone.position.x - GAME_CONSTANTS.HOME_BASE_POS.x;
  const dy = drone.position.y - GAME_CONSTANTS.HOME_BASE_POS.y;
  const distanceToHome = Math.sqrt(dx * dx + dy * dy);
  
  const timeToHomeSec = distanceToHome / calculateSpeed(drone);
  const bingoTimeSec = timeToHomeSec + GAME_CONSTANTS.BINGO_MARGIN_SEC;
  return (bingoTimeSec * calculatePowerDraw(drone)) / 3600;
};
