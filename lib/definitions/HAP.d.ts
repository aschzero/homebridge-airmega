interface Accessory {
  UUID: string;

  on(...args: any[]): void;
  getService(...args: any[]): Service;
  addService(...args: any[]): Service;
  getServiceByUUIDAndSubType(...args: any[]): Service;
  updateReachability(reachable: boolean): void;
}

interface Service {
  AccessoryInformation: void;

  setCharacteristic(...args: any[]): Service;
  getCharacteristic(...args: any[]): Characteristic;
}

interface Characteristic {
  on(...args: any[]): Characteristic;
}

interface Log {
  (...args: any[]): void;
  error(...args: any[]): void;
}

export { Accessory, Service, Characteristic, Log }