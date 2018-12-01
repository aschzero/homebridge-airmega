import { Config } from '../Config';
import { HAP } from '../HAP';
import { Service } from '../interfaces/HAP';
import { Filter } from '../interfaces/PurifierStatus';
import { Logger } from '../Logger';
import { AbstractService } from './AbstractService';

export class FilterService extends AbstractService {
  preFilterStatus: Filter;
  mainFilterStatus: Filter;

  register(): void {
    this.getOrCreateMainFilterService();
    this.getOrCreatePreFilterService();

    this.accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, 'main')
      .getCharacteristic(HAP.Characteristic.FilterChangeIndication)
      .on('get', this.getMainFilterChangeIndication.bind(this));

    this.accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, 'main')
      .getCharacteristic(HAP.Characteristic.FilterLifeLevel)
      .on('get', this.getMainFilterLifeLevel.bind(this));

    this.accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, 'pre')
      .getCharacteristic(HAP.Characteristic.FilterChangeIndication)
      .on('get', this.getPreFilterChangeIndication.bind(this));

    this.accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, 'pre')
      .getCharacteristic(HAP.Characteristic.FilterLifeLevel)
      .on('get', this.getPreFilterLifeLevel.bind(this));
  }

  getOrCreatePreFilterService(): Service {
    let filterService = this.accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, 'pre');

    if (!filterService) {
      filterService = this.accessory.addService(HAP.Service.FilterMaintenance, 'Pre Filter', 'pre');
    }

    return filterService;
  }

  getOrCreateMainFilterService(): Service {
    let filterService = this.accessory.getServiceByUUIDAndSubType(HAP.Service.FilterMaintenance, 'main');

    if (!filterService) {
      filterService = this.accessory.addService(HAP.Service.FilterMaintenance, 'Max 2 Filter', 'main');
    }

    return filterService;
  }

  async updateFilterStatus() {
    try {
      let filterStatus = await this.client.getFilterStatus(this.purifier.id);

      this.preFilterStatus = filterStatus.find(filter => {
        return filter.name == Config.Filters.PRE_FILTER;
      });

      this.mainFilterStatus = filterStatus.find(filter => {
        return filter.name == Config.Filters.MAIN_FILTER;
      });
    } catch(e) {
      Logger.error('Unable to get filter status', e);
    }
  }

  async getPreFilterChangeIndication(callback) {
    if (this.preFilterStatus.lifeLevel <= 20) {
      callback(null, HAP.Characteristic.FilterChangeIndication.CHANGE_FILTER);
    } else {
      callback(null, HAP.Characteristic.FilterChangeIndication.FILTER_OK);
    }
  }

  getPreFilterLifeLevel(callback) {
    callback(null, this.preFilterStatus.lifeLevel);
  }

  getMainFilterChangeIndication(callback) {
    if (this.mainFilterStatus.lifeLevel <= 20) {
      callback(null, HAP.Characteristic.FilterChangeIndication.CHANGE_FILTER);
    } else {
      callback(null, HAP.Characteristic.FilterChangeIndication.FILTER_OK);
    }
  }

  getMainFilterLifeLevel(callback) {
    callback(null, this.mainFilterStatus.lifeLevel);
  }
}