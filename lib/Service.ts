import { Client } from './Client';
import { Purifier } from './Purifier';
import { HAP } from './types';

export class Service {
  purifier: Purifier;
  accessory: HAP.Accessory;
  client: Client;

  constructor(purifier: Purifier, accessory: HAP.Accessory) {
    this.purifier = purifier;
    this.accessory = accessory;

    this.client = new Client();
  }
}