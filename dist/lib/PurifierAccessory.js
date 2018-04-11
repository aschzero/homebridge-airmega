"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Purifier_1 = require("./Purifier");
const Logger_1 = require("./Logger");
const HAP_1 = require("./HAP");
class PurifierAccessory {
    constructor(accessory, properties) {
        this.properties = properties;
        this.accessory = accessory;
        this.purifier = new Purifier_1.Purifier(properties.productId);
        this.setupAccessoryInformationServiceCharacteristics();
        this.setupPurifierServiceCharacteristics();
        this.setupAirQualityServiceCharacteristics();
        this.setupFilterMaintenanceServiceCharacteristics();
        this.setupLightbulbServiceCharacteristics();
        this.accessory.updateReachability(true);
    }
    getOrCreatePurifierService() {
        let purifierService = this.accessory.getService(HAP_1.Hap.Service.AirPurifier);
        if (!purifierService) {
            purifierService = this.accessory.addService(HAP_1.Hap.Service.AirPurifier, this.properties.aliasName);
        }
        return purifierService;
    }
    getOrCreateAirQualityService() {
        let airQualityService = this.accessory.getService(HAP_1.Hap.Service.AirQualitySensor);
        if (!airQualityService) {
            airQualityService = this.accessory.addService(HAP_1.Hap.Service.AirQualitySensor, this.properties.aliasName);
        }
        return airQualityService;
    }
    getOrCreatePreFilterService() {
        let filterService = this.accessory.getServiceByUUIDAndSubType(HAP_1.Hap.Service.FilterMaintenance, 'pre');
        if (!filterService) {
            filterService = this.accessory.addService(HAP_1.Hap.Service.FilterMaintenance, 'Pre Filter', 'pre');
        }
        return filterService;
    }
    getOrCreateMainFilterService() {
        let filterService = this.accessory.getServiceByUUIDAndSubType(HAP_1.Hap.Service.FilterMaintenance, 'main');
        if (!filterService) {
            filterService = this.accessory.addService(HAP_1.Hap.Service.FilterMaintenance, 'Max 2 Filter', 'main');
        }
        return filterService;
    }
    getOrCreateLightbulbService() {
        let lightbulbService = this.accessory.getService(HAP_1.Hap.Service.Lightbulb);
        if (!lightbulbService) {
            lightbulbService = this.accessory.addService(HAP_1.Hap.Service.Lightbulb, this.properties.aliasName);
        }
        return lightbulbService;
    }
    setupAccessoryInformationServiceCharacteristics() {
        this.accessory.getService(HAP_1.Hap.Service.AccessoryInformation)
            .setCharacteristic(HAP_1.Hap.Characteristic.Manufacturer, 'Coway')
            .setCharacteristic(HAP_1.Hap.Characteristic.Model, 'Airmega')
            .setCharacteristic(HAP_1.Hap.Characteristic.SerialNumber, '123-456-789');
    }
    setupPurifierServiceCharacteristics() {
        this.purifierService = this.getOrCreatePurifierService();
        this.purifierService.getCharacteristic(HAP_1.Hap.Characteristic.Active)
            .on('get', this.getActive.bind(this))
            .on('set', this.setActiveCharacteristic.bind(this));
        this.purifierService.getCharacteristic(HAP_1.Hap.Characteristic.CurrentAirPurifierState)
            .on('get', this.getCurrentAirPurifierState.bind(this));
        this.purifierService.getCharacteristic(HAP_1.Hap.Characteristic.TargetAirPurifierState)
            .on('get', this.getTargetPurifierState.bind(this))
            .on('set', this.setTargetPurifierState.bind(this));
        this.purifierService.getCharacteristic(HAP_1.Hap.Characteristic.RotationSpeed)
            .on('get', this.getRotationSpeed.bind(this))
            .on('set', this.setRotationSpeed.bind(this));
    }
    setupFilterMaintenanceServiceCharacteristics() {
        let mainFilterService = this.getOrCreateMainFilterService();
        let preFilterService = this.getOrCreatePreFilterService();
        this.accessory.getServiceByUUIDAndSubType(HAP_1.Hap.Service.FilterMaintenance, 'main')
            .getCharacteristic(HAP_1.Hap.Characteristic.FilterChangeIndication)
            .on('get', this.getMainFilterChangeIndication.bind(this));
        this.accessory.getServiceByUUIDAndSubType(HAP_1.Hap.Service.FilterMaintenance, 'main')
            .getCharacteristic(HAP_1.Hap.Characteristic.FilterLifeLevel)
            .on('get', this.getMainFilterLifeLevel.bind(this));
        this.accessory.getServiceByUUIDAndSubType(HAP_1.Hap.Service.FilterMaintenance, 'pre')
            .getCharacteristic(HAP_1.Hap.Characteristic.FilterChangeIndication)
            .on('get', this.getPreFilterChangeIndication.bind(this));
        this.accessory.getServiceByUUIDAndSubType(HAP_1.Hap.Service.FilterMaintenance, 'pre')
            .getCharacteristic(HAP_1.Hap.Characteristic.FilterLifeLevel)
            .on('get', this.getPreFilterLifeLevel.bind(this));
    }
    setupAirQualityServiceCharacteristics() {
        let airQualityService = this.getOrCreateAirQualityService();
        airQualityService.getCharacteristic(HAP_1.Hap.Characteristic.AirQuality)
            .on('get', this.getAirQuality.bind(this));
    }
    setupLightbulbServiceCharacteristics() {
        let lightbulbService = this.getOrCreateLightbulbService();
        lightbulbService.getCharacteristic(HAP_1.Hap.Characteristic.On)
            .on('get', this.getLightIndicator.bind(this))
            .on('set', this.setLightIndicator.bind(this));
    }
    getActive(callback) {
        if (!this.purifier.properties)
            return;
        if (this.purifier.properties.power) {
            Logger_1.Logger.log(this.properties.aliasName, 'is active');
            callback(null, HAP_1.Hap.Characteristic.Active.ACTIVE);
        }
        else {
            Logger_1.Logger.log(this.properties.aliasName, 'is inactive');
            callback(null, HAP_1.Hap.Characteristic.Active.INACTIVE);
        }
    }
    setActiveCharacteristic(targetState, callback) {
        if (!this.purifier.properties)
            return;
        // Only toggle power when new state is different.
        // Prevents extraneous calls especially when changing
        // the fan speed (setRotationSpeed ensures device is on).
        if (this.purifier.properties.power == targetState) {
            callback(null);
            return;
        }
        this.purifier.togglePower(targetState).then(() => {
            Logger_1.Logger.log(this.properties.aliasName, `Turning ${targetState ? 'on' : 'off'}`);
            // Need to set the current purifier state characteristic here
            // otherwise accessory hangs on 'Turning on...'/'Turning off...'
            if (targetState) {
                this.purifierService.setCharacteristic(HAP_1.Hap.Characteristic.CurrentAirPurifierState, HAP_1.Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
            }
            else {
                this.purifierService.setCharacteristic(HAP_1.Hap.Characteristic.CurrentAirPurifierState, HAP_1.Hap.Characteristic.CurrentAirPurifierState.INACTIVE);
            }
            callback(null);
        }).catch((err) => {
            Logger_1.Logger.log(err);
            callback(err);
        });
    }
    getCurrentAirPurifierState(callback) {
        if (!this.purifier.properties)
            return;
        this.purifier.getLatestData();
        if (!this.purifier.properties.power) {
            callback(null, HAP_1.Hap.Characteristic.CurrentAirPurifierState.INACTIVE);
            return;
        }
        if (this.purifier.properties.fanSpeed == 0 || this.purifier.properties.mode == 2 || this.purifier.properties.mode == 6) {
            Logger_1.Logger.log('Current state is idle');
            callback(null, HAP_1.Hap.Characteristic.CurrentAirPurifierState.IDLE);
            return;
        }
        Logger_1.Logger.log('Current state is purifying');
        callback(null, HAP_1.Hap.Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
    }
    getTargetPurifierState(callback) {
        if (!this.purifier.properties)
            return;
        if (this.purifier.properties.mode == 0) {
            Logger_1.Logger.log('Target purifier state is manual');
            callback(null, HAP_1.Hap.Characteristic.TargetAirPurifierState.MANUAL);
        }
        else {
            Logger_1.Logger.log('Target purifier state is auto');
            callback(null, HAP_1.Hap.Characteristic.TargetAirPurifierState.AUTO);
        }
    }
    setTargetPurifierState(targetState, callback) {
        let targetMode;
        if (targetState) {
            Logger_1.Logger.log('Setting mode to auto');
            targetMode = -1;
        }
        else {
            Logger_1.Logger.log('Setting mode to manual');
            targetMode = 1;
        }
        this.purifier.setFanSpeed(targetMode).then(() => {
            callback(null);
        }).catch((err) => {
            Logger_1.Logger.log(err);
            callback(err);
        });
    }
    getRotationSpeed(callback) {
        let intervals = { 1: 20, 2: 50, 3: 100 };
        let fanSpeed = intervals[this.purifier.properties.fanSpeed];
        Logger_1.Logger.log(`Rotation speed is ${fanSpeed}`);
        callback(null, fanSpeed);
    }
    setRotationSpeed(targetState, callback) {
        let targetSpeed;
        let ranges = { 1: [0, 40], 2: [40, 70], 3: [70, 100] };
        for (var key in ranges) {
            var currentSpeed = ranges[key];
            if (targetState > currentSpeed[0] && targetState <= currentSpeed[1]) {
                targetSpeed = key;
                break;
            }
        }
        Logger_1.Logger.log(`Setting rotation speed to ${targetSpeed}`);
        this.purifier.setFanSpeed(targetSpeed).then(() => {
            callback(null);
        }).catch((err) => {
            Logger_1.Logger.log(err);
            callback(err);
        });
    }
    getPreFilterChangeIndication(callback) {
        if (this.purifier.properties.filter2ExchAlarm) {
            callback(null, HAP_1.Hap.Characteristic.FilterChangeIndication.CHANGE_FILTER);
        }
        else {
            callback(null, HAP_1.Hap.Characteristic.FilterChangeIndication.FILTER_OK);
        }
    }
    getPreFilterLifeLevel(callback) {
        this.purifier.getFilterLifeLevels().then((data) => {
            callback(null, data.prefilter);
        }).catch((err) => {
            Logger_1.Logger.log(err);
            callback(err);
        });
    }
    getMainFilterChangeIndication(callback) {
        if (!this.purifier.properties)
            return;
        if (this.purifier.properties.filter1ExchAlarm) {
            callback(null, HAP_1.Hap.Characteristic.FilterChangeIndication.CHANGE_FILTER);
        }
        else {
            callback(null, HAP_1.Hap.Characteristic.FilterChangeIndication.FILTER_OK);
        }
    }
    getMainFilterLifeLevel(callback) {
        if (!this.purifier.properties)
            return;
        this.purifier.getFilterLifeLevels().then((data) => {
            callback(null, data.hepafilter);
        }).catch((err) => {
            Logger_1.Logger.log(err);
            callback(err);
        });
    }
    getAirQuality(callback) {
        if (!this.purifier.properties)
            return;
        let result;
        switch (this.purifier.properties.dustPollutionLev) {
            case 1:
                result = HAP_1.Hap.Characteristic.AirQuality.EXCELLENT;
                break;
            case 2:
                result = HAP_1.Hap.Characteristic.AirQuality.GOOD;
                break;
            case 3:
                result = HAP_1.Hap.Characteristic.AirQuality.FAIR;
                break;
            case 4:
                result = HAP_1.Hap.Characteristic.AirQuality.INFERIOR;
                break;
        }
        callback(null, result);
    }
    getLightIndicator(callback) {
        if (!this.purifier.properties)
            return;
        this.purifier.getLatestData().then(() => {
            let isOn = (this.purifier.properties.mood == 2);
            callback(null, isOn);
        }).catch((err) => {
            callback(err);
        });
    }
    setLightIndicator(targetState, callback) {
        Logger_1.Logger.log(`Turning light ${(targetState ? 'on' : 'off')}`);
        this.purifier.toggleLight(targetState).then(() => {
            callback(null);
        }).catch((err) => {
            callback(err);
        });
    }
}
exports.PurifierAccessory = PurifierAccessory;
//# sourceMappingURL=PurifierAccessory.js.map