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
      this.moveDrone(droneState, delta, store.resolveDeployment);
    } else if (droneState.status === 'crashed') {
      this.droneSprite.setFillStyle(0xff0000); // Red wreckage
    } else {
      this.droneSprite.setFillStyle(0x00ffff); // Normal color
    }
  }

  private moveDrone(droneState: any, delta: number, onComplete: () => void) {
    // Calculate dynamic speed based on payload
    // v = vMax * (1 - 0.5 * mPayload / mMax) -> m/s which equals px/s
    const speedPxPerSec = droneState.vMax * (1 - 0.5 * droneState.mPayload / droneState.mMax);
    const speed = speedPxPerSec / 1000; // px per ms

    const target = droneState.targetPosition;
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
