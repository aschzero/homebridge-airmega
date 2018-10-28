import { Client } from './Client';
import { Purifier } from './Purifier';
import { HAP, PurifierResponse } from './types';
import { Logger } from './Logger';

export class Service {
  purifier: Purifier;
  accessory: HAP.Accessory;
  client: Client;

  statusUpdateHandler: Promise<PurifierResponse.Status>;

  constructor(purifier: Purifier, accessory: HAP.Accessory) {
    this.client = new Client();

    this.purifier = purifier;
    this.accessory = accessory;
  }

  async waitForStatusUpdate(): Promise<PurifierResponse.Status> {
    let status = await this.statusUpdateHandler;

    return status;
  }

  async updateStatus() {
    try {
      let status = await this.client.getStatus(this.purifier.id);
      this.purifier.setStatus(status);

      return status;
    } catch(e) {
      Logger.error('Unable to update purifier status', e);
    }
  }
}