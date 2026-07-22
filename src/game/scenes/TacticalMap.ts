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

  update(_time: number, _delta: number) {
    const store = useGameStore.getState();
    const droneState = store.drone;

    // Sync visual position with store state
    // We can just set it, or lerp slightly if we wanted smoothness. 
    // Since tick is 1 Hz, setting it directly will jump once per second.
    // For a smoother visual, we can lerp towards the store's position.
    this.droneSprite.x += (droneState.position.x - this.droneSprite.x) * 0.1;
    this.droneSprite.y += (droneState.position.y - this.droneSprite.y) * 0.1;

    if (droneState.status === 'crashed') {
      this.droneSprite.setFillStyle(0xff0000); // Red wreckage
    } else {
      this.droneSprite.setFillStyle(0x00ffff); // Normal color
    }
  }
}
