import { Scene } from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { GAME_CONSTANTS } from '../../constants';

export class TacticalMap extends Scene {
  private droneSprite!: Phaser.GameObjects.Arc;
  private droneRangeRing!: Phaser.GameObjects.Arc;

  constructor() {
    super('TacticalMap');
  }

  create() {
    const { width, height } = this.scale;

    // Draw Map Background Grid
    this.add.grid(width/2, height/2, width, height, 50, 50, 0x111111).setAltFillStyle(0x1a1a1a);

    // Draw Home Base
    this.add.rectangle(GAME_CONSTANTS.HOME_BASE_POS.x, GAME_CONSTANTS.HOME_BASE_POS.y, 80, 80, 0x005500, 0.5);
    
    // Draw Target Zone
    this.add.rectangle(GAME_CONSTANTS.TARGET_POS.x, GAME_CONSTANTS.TARGET_POS.y, 100, 100, 0x550000, 0.5);
    this.add.text(GAME_CONSTANTS.TARGET_POS.x - 40, GAME_CONSTANTS.TARGET_POS.y - 60, 'SECTOR 4', { color: '#ff5555' });

    // Initialize Drone Sprite & Range Ring
    const store = useGameStore.getState();
    const droneState = store.drone;
    
    this.droneRangeRing = this.add.circle(droneState.position.x, droneState.position.y, GAME_CONSTANTS.COMM_RANGE, 0x00ff00, 0.1)
        .setStrokeStyle(1, 0x00ff00, 0.5);
        
    this.droneSprite = this.add.circle(droneState.position.x, droneState.position.y, 10, 0x00ffff);
  }

  update(_time: number, _delta: number) {
    const store = useGameStore.getState();
    const droneState = store.drone;
    const networkConnected = store.networkConnected;

    this.droneSprite.x += (droneState.position.x - this.droneSprite.x) * 0.1;
    this.droneSprite.y += (droneState.position.y - this.droneSprite.y) * 0.1;
    
    this.droneRangeRing.x = this.droneSprite.x;
    this.droneRangeRing.y = this.droneSprite.y;

    if (droneState.status === 'crashed') {
      this.droneSprite.setFillStyle(0xff0000); // Red wreckage
      this.droneRangeRing.setVisible(false);
    } else {
      this.droneSprite.setFillStyle(0x00ffff); // Normal color
      if (networkConnected) {
        this.droneRangeRing.setVisible(true);
      } else {
        this.droneRangeRing.setVisible(false);
      }
    }
  }
}
