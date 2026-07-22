import { forwardRef, useLayoutEffect, useRef } from 'react';
import { Game } from 'phaser';
import { TacticalMap } from './scenes/TacticalMap';
import { GAME_CONSTANTS } from '../constants';

export const PhaserGame = forwardRef<HTMLDivElement>((_props, _ref) => {
    const gameRef = useRef<Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!gameRef.current && containerRef.current) {
            gameRef.current = new Game({
                type: Phaser.AUTO,
                width: GAME_CONSTANTS.CANVAS_WIDTH,
                height: GAME_CONSTANTS.CANVAS_HEIGHT,
                parent: containerRef.current,
                backgroundColor: '#050505',
                scene: [TacticalMap]
            });
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
