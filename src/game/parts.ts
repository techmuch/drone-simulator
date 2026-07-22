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

export function compileBlueprint(blueprint: Omit<DroneBlueprint, 'id' | 'name'>) {
  const airframe = AIRFRAMES.find(p => p.id === blueprint.airframeId);
  const battery = BATTERIES.find(p => p.id === blueprint.batteryId);
  const radio = RADIOS.find(p => p.id === blueprint.radioId);
  const payload = blueprint.auxPayloadId ? PAYLOADS.find(p => p.id === blueprint.auxPayloadId) : undefined;
  
  if (!airframe || !battery || !radio) return null;

  const payloadMass = payload ? payload.massKg : 0;
  const payloadCost = payload ? payload.cost : 0;

  return {
    totalCost: airframe.cost + battery.cost + radio.cost + payloadCost,
    batteryMaxWh: battery.specs.capacityWh!,
    pBase: airframe.specs.basePowerDrawW!,
    pRadio: radio.specs.basePowerDrawW!,
    mPayload: battery.massKg + radio.massKg + payloadMass,
    mMax: airframe.specs.maxPayloadKg!,
    vMax: airframe.specs.maxSpeedMs!,
    radioRangeMeters: radio.specs.radioRangeMeters!,
    payloadId: blueprint.auxPayloadId,
  };
}

export const AIRFRAMES: ComponentPart[] = [
  {
    id: 'af-scout',
    name: 'Scout Frame',
    type: 'airframe',
    massKg: 1.0,
    cost: 500,
    specs: {
      maxPayloadKg: 1.0,
      basePowerDrawW: 20,
      maxSpeedMs: 15,
    }
  },
  {
    id: 'af-heavy',
    name: 'Heavy Lifter',
    type: 'airframe',
    massKg: 2.5,
    cost: 1200,
    specs: {
      maxPayloadKg: 4.5,
      basePowerDrawW: 50,
      maxSpeedMs: 8,
    }
  }
];

export const BATTERIES: ComponentPart[] = [
  {
    id: 'bat-standard',
    name: 'Standard LiPo',
    type: 'battery',
    massKg: 0.5,
    cost: 100,
    specs: {
      capacityWh: 80,
    }
  },
  {
    id: 'bat-heavy',
    name: 'Heavy Solid State',
    type: 'battery',
    massKg: 1.5,
    cost: 300,
    specs: {
      capacityWh: 200,
    }
  }
];

export const RADIOS: ComponentPart[] = [
  {
    id: 'rad-omni',
    name: 'Omni Relay',
    type: 'radio',
    massKg: 0.2,
    cost: 150,
    specs: {
      radioRangeMeters: 200,
      basePowerDrawW: 5,
    }
  },
  {
    id: 'rad-beam',
    name: 'Directional Beam',
    type: 'radio',
    massKg: 0.8,
    cost: 400,
    specs: {
      radioRangeMeters: 500,
      basePowerDrawW: 15,
    }
  }
];

export const PAYLOADS: ComponentPart[] = [
  {
    id: 'pay-none',
    name: 'None',
    type: 'payload',
    massKg: 0,
    cost: 0,
    specs: {}
  },
  {
    id: 'pay-winch',
    name: 'Salvage Winch',
    type: 'payload',
    massKg: 1.0,
    cost: 200,
    specs: {}
  }
];
