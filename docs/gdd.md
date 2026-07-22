# Drone Simulator - Game Design Document

## 1. Overview
**Title:** Drone Simulator
**Core Concept:** A spatial puzzle and resource management game. Players operate drones to establish ad-hoc mesh networks in disaster zones. The player must balance drone placement, modular payloads, and battery life to maintain a persistent network connection.
**Visual Perspective:** Top-Down Tactical Vector (high-tech emergency management radar). Features a dark grid background, vector-style drone icons, glowing range-ring overlays (green for active links, pulsing red for dying nodes), and subtle topographical contour lines.

## 2. Technology Stack
*   **Engine (Spatial Logic):** Phaser 4 (2D engine with highly performant GPU renderer)
*   **UI/HUD:** React + Tailwind CSS (Overlaid on top of the Phaser canvas)
*   **State Management:** Zustand (Acts as the bridge between Phaser and React)
*   **Bundler:** Vite

## 3. Core Mechanics

### The Spatial Puzzle (Mesh Network)
Drones act as network nodes. They must be placed within radio range of each other to maintain a chain from the Home Base to the target disaster sector. Distance calculations are exact 2D Euclidean distances.

### The Temporal Puzzle (Replacement Cycle)
Drones have limited flight time due to battery drain. Players must dispatch replacement drones from Home Base, accounting for travel time, before the active drone's battery dies ("Bingo Fuel" mechanics).

### The Adjudication Engine (Math)
The simulation logic ticks at 1 Hz, separate from Phaser's render loop (60 FPS).
*   **Power Draw:** `P_total = P_base * (1 + m_payload / m_max) + P_radio`
*   **Travel Speed:** `v = v_max * (1 - 0.5 * m_payload / m_max)`
*   **Bingo Fuel Threshold (sec):** `(Distance_to_Home / v) + Margin_of_Safety`

## 4. Game Loop / Flow

### 4.1. The Hook (Initialization)
Title screen with a narrative frame. E.g., "Hurricane Zeta has knocked out comms in Sector 4. Medical teams are flying blind. We need a mesh network established immediately."

### 4.2. The Briefing
High-level topographical map showing mission parameters, target sectors, and environmental hazards (e.g., "High winds detected").

### 4.3. The Hangar (Procurement & Loadout)
Players use budget/requisition points to design and build custom drones from modular parts.
*   **Airframes:**
    *   *Scout:* Fast (15 m/s), low payload (1.0 kg), 20W base draw. Great for rapid replacement.
    *   *Heavy Lifter:* Slow (8 m/s), high payload (4.5 kg), 50W base draw. Can carry heavy batteries and radios.
    *   *Tethered Node:* Static, acts as an anchor point.
*   **Components:**
    *   *Batteries:* Standard LiPo vs. Heavy Solid State.
    *   *Radios:* Omni Relay (short range, low power) vs. Directional Beam (long range, high power).
*   **UI (Simulation Predictor):** Automatically recalculates and displays stats (Loiter Time, Travel Speed) as parts are swapped so the player can make informed decisions.

### 4.4. Deployment & Execution (Action Phase)
RTS-style point-and-click interactions on the tactical map. The economic menus disappear, and the player watches the live tactical view.
*   **Deploy:** Click a blueprint in the React HUD, then click a destination point on the Phaser map. The drone launches from Home Base.
*   **Reposition:** Click an active drone, then click a new destination to dynamically stretch the network.
*   **Bingo Fuel:** UI shows a warning on the drone's battery bar indicating the exact threshold where it must return to base or crash.

### 4.5. The Persistent Map & Campaign
The game is a continuous, persistent campaign. 
*   **Rolling Objectives:** As one sector recovers, its Relief Timer expires. Ground infrastructure is restored, releasing the drones covering that sector.
*   **Logistical Rubber Band:** The player must safely navigate the unneeded drones back to base to reclaim their expensive parts for the next, harder sector.

## 5. Environment & Events
*   **Hand-Crafted Maps:** Curated maps with specific topographical challenges (e.g., urban bridges, mountainous coastlines).
*   **Procedural Weather Hazards:** Circular "storm cells" randomly drift across the tactical map. Drones caught in a storm suffer a 40% battery drain penalty and reduced signal range, forcing the player to route the mesh around the weather.

## 6. Failure States & Penalties
*   **Mesh Breakage:** If a link breaks, a 10-second "Buffer" timer starts. If unrecovered, the target sector's Relief Timer actively regresses (representing conditions worsening).
*   **Wreckage (Crashes):** Drones that run out of battery crash and become persistent "Wreckage Nodes." They can be recovered in future missions by building a specialized drone with a Winch Payload.
*   **Bounties:** When a sector's Relief Timer hits 0, a cash payout is awarded based on network uptime.
*   **Game Over:** Reaching total Bankruptcy—having no money, no parts, and no physical way to bridge the network.

## 7. Data Schema (TypeScript)

```typescript
// --- PARTS & BLUEPRINTS ---
export type PartType = 'airframe' | 'battery' | 'radio' | 'payload';

export interface ComponentPart {
  id: string;
  name: string;
  type: PartType;
  massKg: number;
  cost: number;
  specs: {
    maxPayloadKg?: number;
    basePowerDrawW?: number;
    capacityWh?: number;
    radioRangeMeters?: number;
    maxSpeedMs?: number;
  };
}

export interface DroneBlueprint {
  id: string;
  name: string;
  airframeId: string;
  batteryId: string;
  radioId: string;
  auxPayloadId?: string;
}

// --- SIMULATION ENTITIES ---
export interface Vector2D {
  x: number;
  y: number;
}

export interface ActiveDrone {
  instanceId: string;
  blueprintId: string;
  position: Vector2D;
  targetPosition: Vector2D | null;
  currentWh: number;
  status: 'deploying' | 'loitering' | 'returning' | 'crashed';
  distanceToBase: number;
  bingoWhThreshold: number;
}

export interface SectorTarget {
  id: string;
  name: string;
  position: Vector2D;
  requiredBandwidthMbps: number;
  isCovered: boolean;
  timeRemainingSec: number; // Ticks down to sector relief
  status: 'active' | 'recovering' | 'cleared';
}

// --- GLOBAL GAME STORE SCHEMA ---
export interface CampaignState {
  credits: number;
  inventory: Record<string, number>; // Part ID -> Quantity
  blueprints: DroneBlueprint[];
  activeDrones: ActiveDrone[];
  sectors: SectorTarget[];
  networkMeshConnected: boolean;
  
  // Actions
  dispatchDrone: (blueprintId: string, target: Vector2D) => void;
  recallDrone: (instanceId: string) => void;
  tickSimulation: () => void;
}
```
