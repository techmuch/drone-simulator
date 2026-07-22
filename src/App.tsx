import { PhaserGame } from './game/PhaserGame';
import { HUD } from './ui/HUD';

function App() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans">
      <div className="relative shadow-2xl border border-neutral-800 rounded overflow-hidden w-[800px] h-[600px]">
        <PhaserGame />
        <HUD />
      </div>
    </div>
  );
}

export default App;
