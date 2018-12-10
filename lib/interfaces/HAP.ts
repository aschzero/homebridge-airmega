export interface Accessory {
  new (name: string, uuid: string): Accessory;

  UUID: string;
  reachability: boolean;
  services: Service[];

  on(...args: any[]): void;
  getService(...args: any[]): Service;
  addService(...args: any[]): Service;
  removeService(...args: any[]): void;
  getServiceByUUIDAndSubType(...args: any[]): Service;
  updateReachability(reachable: boolean): void;
}

export interface Service {
  UUID: string;
  AccessoryInformation: void;

  AirPurifier: Service;
  Lightbulb: Service;
  AirQualitySensor: Service;
  FilterMaintenance: Service;

  setCharacteristic(...args: any[]): Service;
  getCharacteristic(...args: any[]): Characteristic;
}

export interface Characteristic {
  Manufacturer: Characteristic;
  Model: Characteristic;
  SerialNumber: Characteristic;

  On: any;
  Active: any;
  CurrentAirPurifierState: any;
  TargetAirPurifierState: any;
  RotationSpeed: any;
  AirQuality: any;
  FilterChangeIndication: any;
  FilterLifeLevel: any;

  on(...args: any[]): Characteristic;
  updateValue(...args: any[]): Characteristic;
}

export interface Log {
  (...args: any[]): void;
  error(...args: any[]): void;
}

export interface AccessoryConfig {
  error(...args: any[]): void
}

export interface Platform {
  on(...args: any[]): void
  registerPlatformAccessories(...args: any[]): void;
}

export interface UUID {
  generate(string): string;
}