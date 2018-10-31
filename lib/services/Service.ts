import { Client } from '../Client';
import { Purifier } from '../Purifier';
import { HAP, PurifierResponse } from '../types';
import { Logger } from '../Logger';
import { Deferred } from '../util/Deferred';
import { ServiceFactory } from '../ServiceFactory';

export class Service {
  purifier: Purifier;
  accessory: HAP.Accessory;
  client: Client;

  deferredStatus: Deferred<void>;

  constructor(purifier: Purifier, accessory: HAP.Accessory) {
    this.client = new Client();
    this.deferredStatus = new Deferred<void>();

    this.purifier = purifier;
    this.accessory = accessory;
  }

  async updateStatus() {
    try {
      let status = await this.client.getStatus(this.purifier.id);
      this.purifier.setStatus(status);

      ServiceFactory.services.forEach(service => {
        service.deferredStatus.resolve();
        setTimeout(() => {
          service.deferredStatus = new Deferred<void>();
        }, 1000);
      });

      return status;
    } catch(e) {
      Logger.error('Unable to update purifier status', e);
    }
  }
}