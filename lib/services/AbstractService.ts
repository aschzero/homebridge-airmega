import { Client } from '../Client';
import { Purifier } from '../Purifier';
import { Accessory } from '../interfaces/HAP';

export abstract class AbstractService {
  client: Client;
  purifier: Purifier;
  accessory: Accessory;

  constructor(purifier: Purifier, accessory: Accessory) {
    this.client = new Client();

    this.purifier = purifier;
    this.accessory = accessory;
  }

  abstract register(): void;
}