import { Client } from '../Client';
import { Purifier } from '../Purifier';
import { HAP, PurifierResponse } from '../types';
import { Deferred } from '../util/Deferred';

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