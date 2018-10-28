import { Config } from './Config';
import { Hap } from './HAP';
import { Logger } from './Logger';
import { Service } from './Service';
import { HAP, PurifierResponse } from './types';

export class FilterService extends Service {
  preFilterStatus: PurifierResponse.FilterStatus;
  mainFilterStatus: PurifierResponse.FilterStatus;

  registerServices(): void {
    this.getOrCreateMainFilterService();
    this.getOrCreatePreFilterService();

    this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main')
      .getCharacteristic(Hap.Characteristic.FilterChangeIndication)
      .on('get', this.getMainFilterChangeIndication.bind(this));

    this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main')
      .getCharacteristic(Hap.Characteristic.FilterLifeLevel)
      .on('get', this.getMainFilterLifeLevel.bind(this));

    this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre')
      .getCharacteristic(Hap.Characteristic.FilterChangeIndication)
      .on('get', this.getPreFilterChangeIndication.bind(this));

    this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre')
      .getCharacteristic(Hap.Characteristic.FilterLifeLevel)
      .on('get', this.getPreFilterLifeLevel.bind(this));
  }

  getOrCreatePreFilterService(): HAP.Service {
    let filterService = this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'pre');

    if (!filterService) {
      filterService = this.accessory.addService(Hap.Service.FilterMaintenance, 'Pre Filter', 'pre');
    }

    return filterService;
  }

  getOrCreateMainFilterService(): HAP.Service {
    let filterService = this.accessory.getServiceByUUIDAndSubType(Hap.Service.FilterMaintenance, 'main');

    if (!filterService) {
      filterService = this.accessory.addService(Hap.Service.FilterMaintenance, 'Max 2 Filter', 'main');
    }

    return filterService;
  }

  async getPreFilterChangeIndication(callback) {
    // MOVE THIS
    try {
      let filterStatus = await this.client.getFilterStatus(this.purifier.id);

      this.preFilterStatus = filterStatus.find(filter => {
        return filter.name == Config.Filters.PRE_FILTER;
      });

      this.mainFilterStatus = filterStatus.find(filter => {
        return filter.name == Config.Filters.MAIN_FILTER;
      });
    } catch(e) {
      Logger.error('Unable to update filter status', e);
      callback(e);
    }

    if (this.preFilterStatus.lifeLevel <= 20) {
      callback(null, Hap.Characteristic.FilterChangeIndication.CHANGE_FILTER);
    } else {
      callback(null, Hap.Characteristic.FilterChangeIndication.FILTER_OK);
    }
  }

  getPreFilterLifeLevel(callback) {
    callback(null, this.preFilterStatus.lifeLevel);
  }

  getMainFilterChangeIndication(callback) {
    if (this.mainFilterStatus.lifeLevel <= 20) {
      callback(null, Hap.Characteristic.FilterChangeIndication.CHANGE_FILTER);
    } else {
      callback(null, Hap.Characteristic.FilterChangeIndication.FILTER_OK);
    }
  }

  getMainFilterLifeLevel(callback) {
    callback(null, this.mainFilterStatus.lifeLevel);
  }
}