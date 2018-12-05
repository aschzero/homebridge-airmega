import { Accessory, Characteristic, Service, UUID } from './interfaces/HAP';

export class HAP {
  private static _accessory: Accessory;
  private static _service: Service;
  private static _characteristic: Characteristic;
  private static _uuid: UUID;

  public static get Accessory() {
    return this._accessory;
  }

  public static set Accessory(accessory) {
    this._accessory = accessory;
  }

  public static get Service() {
    return this._service;
  }

  public static set Service(hap) {
    this._service = hap;
  }

  public static get Characteristic() {
    return this._characteristic;
  }

  public static set Characteristic(characteristic) {
    this._characteristic = characteristic;
  }

  public static get UUID() {
    return this._uuid;
  }

  public static set UUID(uuid) {
    this._uuid = uuid;
  }
}

