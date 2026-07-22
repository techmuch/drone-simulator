import { forwardRef, useLayoutEffect, useRef } from 'react';
import { Game } from 'phaser';
import { TacticalMap } from './scenes/TacticalMap';
import { EventBus } from './EventBus';

export const PhaserGame = forwardRef<HTMLDivElement>((_props, _ref) => {
    const gameRef = useRef<Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!gameRef.current && containerRef.current) {
            gameRef.current = new Game({
                type: Phaser.AUTO,
                width: 800,
                height: 600,
                parent: containerRef.current,
                backgroundColor: '#050505',
                scene: [TacticalMap]
            });
            EventBus.emit('current-scene-ready', gameRef.current.scene.scenes[0]);
        }
        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return <div ref={containerRef} id="game-container"></div>;
});
