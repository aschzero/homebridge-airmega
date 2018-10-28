import { Client } from './Client';
import { Hap } from './HAP';
import { Logger } from './Logger';
import { Purifier } from './Purifier';
import { HAP, PurifierResponse } from './types';
import { ServiceFactory } from './ServiceFactory';

export class AirmegaAccessory {
  client: Client;
  purifier: Purifier;
  accessory: HAP.Accessory;

  constructor(accessory: HAP.Accessory, purifier: Purifier) {
    this.purifier = purifier;
    this.accessory = accessory;
    this.client = new Client();

    this.setInformationCharacteristics();

    let serviceFactory = new ServiceFactory(this.purifier, this.accessory);
    serviceFactory.registerServices();

    this.accessory.updateReachability(true);

    Logger.log(`Created accessory for '${this.purifier.name}'`);
  }

  setInformationCharacteristics(): void {
    this.accessory.getService(Hap.Service.AccessoryInformation)
      .setCharacteristic(Hap.Characteristic.Manufacturer, 'Coway')
      .setCharacteristic(Hap.Characteristic.Model, 'Airmega')
      .setCharacteristic(Hap.Characteristic.SerialNumber, this.purifier.id);
  }
}