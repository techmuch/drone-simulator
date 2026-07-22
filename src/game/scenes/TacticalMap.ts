import { Scene } from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { GAME_CONSTANTS } from '../../constants';

export class TacticalMap extends Scene {
  private droneSprite!: Phaser.GameObjects.Arc;

  constructor() {
    super('TacticalMap');
  }

  create() {
    const { width, height } = this.scale;

    // Draw Map Background Grid
    this.add.grid(width/2, height/2, width, height, 50, 50, 0x111111).setAltFillStyle(0x1a1a1a);

    // Draw Home Base
    this.add.rectangle(GAME_CONSTANTS.HOME_BASE_POS.x, GAME_CONSTANTS.HOME_BASE_POS.y, 80, 80, 0x005500, 0.5);

    // Initialize Drone Sprite
    const droneState = useGameStore.getState().drone;
    this.droneSprite = this.add.circle(droneState.position.x, droneState.position.y, 10, 0x00ffff);
  }

  update(_time: number, delta: number) {
    const store = useGameStore.getState();
    const droneState = store.drone;

    if (droneState.status === 'deploying' && droneState.targetPosition) {
      this.moveDrone(droneState.targetPosition, delta, store.resolveDeployment);
    }
  }

  private moveDrone(target: {x: number, y: number}, delta: number, onComplete: () => void) {
    const speed = 0.2; // pixels per ms
    const dx = target.x - this.droneSprite.x;
    const dy = target.y - this.droneSprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      this.droneSprite.x += (dx / dist) * speed * delta;
      this.droneSprite.y += (dy / dist) * speed * delta;
    } else {
      this.droneSprite.x = target.x;
      this.droneSprite.y = target.y;
      onComplete();
    }
  }
}
