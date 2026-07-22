import { Scene } from 'phaser';
import { useGameStore } from '../../store/useGameStore';

export class TacticalMap extends Scene {
  private droneSprite!: Phaser.GameObjects.Arc;

  constructor() {
    super('TacticalMap');
  }

  create() {
    const { width, height } = this.scale;

    // Draw Map Background Grid
    this.add.grid(width/2, height/2, width, height, 50, 50, 0x111111).setAltFillStyle(0x1a1a1a);

    // Draw Target Zone (Disaster Sector)
    this.add.rectangle(600, 100, 100, 100, 0x550000, 0.5);
    this.add.text(550, 40, 'SECTOR 4', { color: '#ff5555' });

    // Draw Home Base
    this.add.rectangle(100, 500, 80, 80, 0x005500, 0.5);
    this.add.text(60, 440, 'HOME BASE', { color: '#55ff55' });

    // Initialize Drone Sprite
    const droneState = useGameStore.getState().drone;
    this.droneSprite = this.add.circle(droneState.position.x, droneState.position.y, 10, 0x00ffff);
    
    // Simple visual radar sweep effect
    this.tweens.add({
      targets: this.droneSprite,
      alpha: 0.5,
      yoyo: true,
      repeat: -1,
      duration: 500
    });
  }

  update(_time: number, delta: number) {
    const droneState = useGameStore.getState().drone;

    if (droneState.status === 'deploying' && droneState.targetPosition) {
      // Linear interpolation towards target
      const speed = 0.2; // pixels per ms
      const dx = droneState.targetPosition.x - this.droneSprite.x;
      const dy = droneState.targetPosition.y - this.droneSprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        this.droneSprite.x += (dx / dist) * speed * delta;
        this.droneSprite.y += (dy / dist) * speed * delta;
      }
    }
  }
}
