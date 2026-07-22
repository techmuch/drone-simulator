import { Scene } from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { GAME_CONSTANTS } from '../../constants';

export class TacticalMap extends Scene {
  private droneSprite!: Phaser.GameObjects.Arc;
  private droneRangeRing!: Phaser.GameObjects.Arc;
  private stormSprites: Phaser.GameObjects.Arc[] = [];
  private wreckageGroup!: Phaser.GameObjects.Group;

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
    const storms = store.stormCells;

    // Draw Storm Cells
    this.stormSprites = storms.map(storm => 
      this.add.circle(storm.position.x, storm.position.y, storm.radius, 0x555555, 0.4)
          .setStrokeStyle(2, 0x888888, 0.6)
    );
    
    this.wreckageGroup = this.add.group();

    this.droneRangeRing = this.add.circle(droneState.position.x, droneState.position.y, droneState.radioRangeMeters, 0x00ff00, 0.1)
        .setStrokeStyle(1, 0x00ff00, 0.5);
        
    this.droneSprite = this.add.circle(droneState.position.x, droneState.position.y, 10, 0x00ffff);
  }

  update(_time: number, _delta: number) {
    const store = useGameStore.getState();
    const droneState = store.drone;
    const networkConnected = store.networkConnected;
    const storms = store.stormCells;

    // Update Storm positions
    storms.forEach((storm, index) => {
      this.stormSprites[index].x = storm.position.x;
      this.stormSprites[index].y = storm.position.y;
    });

    // Render Wreckage
    this.wreckageGroup.clear(true, true);
    store.wreckage.forEach(w => {
      const wSprite = this.add.circle(w.position.x, w.position.y, 8, 0x880000).setStrokeStyle(1, 0xff0000, 0.8);
      this.wreckageGroup.add(wSprite);
    });

    this.droneSprite.x += (droneState.position.x - this.droneSprite.x) * 0.1;
    this.droneSprite.y += (droneState.position.y - this.droneSprite.y) * 0.1;
    
    this.droneRangeRing.x = this.droneSprite.x;
    this.droneRangeRing.y = this.droneSprite.y;

    if (droneState.status === 'crashed') {
      this.droneSprite.setFillStyle(0xff0000); // Red wreckage
      this.droneRangeRing.setFillStyle(0xff0000, 0.1).setStrokeStyle(1, 0xff0000, 0.5);
    } else {
      this.droneSprite.setFillStyle(0x00ffff); // Normal color
      
      const range = droneState.inStorm ? droneState.radioRangeMeters * 0.5 : droneState.radioRangeMeters;
      // Shrink/Grow the ring dynamically
      this.droneRangeRing.setRadius(this.droneRangeRing.radius + (range - this.droneRangeRing.radius) * 0.1);

      if (networkConnected) {
        this.droneRangeRing.setFillStyle(0x00ff00, 0.1).setStrokeStyle(1, 0x00ff00, 0.5);
      } else {
        this.droneRangeRing.setFillStyle(0xff0000, 0.1).setStrokeStyle(1, 0xff0000, 0.5);
      }
    }
  }
}
