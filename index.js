var Service, Characteristic;

const Device = require('./src/device');
const Authenticator = require('./src/authenticator');
const constants = require('./src/constants');

module.exports = function (homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory('homebridge-airmega', 'Airmega', Airmega);
};

class Airmega {
  constructor(log, config) {
    this.name = config['name'];
    this.log = log;
  
    var authenticator = new Authenticator({
      email: config['email'],
      password: config['password'],
      log: this.log
    });
  
    authenticator.authenticate().then((data) => {
      this.device = new Device({
        userToken: data.userToken,
        deviceId: data.deviceId,
        log: this.log
      });
    });
  }

  getServices() {
    let informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'Coway')
      .setCharacteristic(Characteristic.Model, 'Airmega')
      .setCharacteristic(Characteristic.SerialNumber, '123-456-789');

    let purifierService = new Service.AirPurifier(this.name);

    purifierService
      .getCharacteristic(Characteristic.Active)
      .on('get', this.getActiveCharacteristic.bind(this))
      .on('set', this.setActiveCharacteristic.bind(this));

    purifierService
      .getCharacteristic(Characteristic.CurrentAirPurifierState)
      .on('get', this.getCurrentAirPurifierState.bind(this));

    purifierService
      .getCharacteristic(Characteristic.TargetAirPurifierState)
      .on('get', this.getTargetAirPurifierState.bind(this));

    purifierService
      .getCharacteristic(Characteristic.RotationSpeed)
      .on('get', this.getRotationSpeed.bind(this))
      .on('set', this.setRotationSpeed.bind(this));

    return [informationService, purifierService];
  }

  getActiveCharacteristic(callback) {
    if (this.device == null) return;

    this.device.getLatestData().then((data) => {
      if (data.power) {
        this.log('Airmega is on');
        callback(null, Characteristic.Active.ACTIVE);
      } else {
        this.log('Airmega is off');
        callback(null, Characteristic.Active.INACTIVE);
      }
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  setActiveCharacteristic(targetState, callback) {
    if (this.device == null) return;

    this.device.togglePower(targetState).then(() => {
      if (targetState) {
        this.purifierService.setCharacteristic(Characteristic.CurrentAirPurifierState, Characteristic.CurrentAirPurifierState.PURIFYING_AIR);   
      } else {
        this.purifierService.setCharacteristic(Characteristic.CurrentAirPurifierState, Characteristic.CurrentAirPurifierState.INACTIVE);
      }

      this.log(`Set power to ${targetState}`);
      callback(null);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  getCurrentAirPurifierState(callback) {
    if (this.device == null) return;
    let currentState;

    this.device.getLatestData().then((data) => {
      if (!data.power) {
        currentState = Characteristic.CurrentAirPurifierState.INACTIVE;
      }

      if (data.fanSpeed == 0 || data.mode == 2) {
        currentState = Characteristic.CurrentAirPurifierState.IDLE;
      }

      currentState = Characteristic.CurrentAirPurifierState.PURIFYING_AIR;

      this.log(`Current state is ${currentState}`);
      callback(null, currentState);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  getTargetAirPurifierState(callback) {
    if (this.device == null) return;
    let targetState;

    this.device.getLatestData().then((data) => {
      if (data.mode == 0) {
        targetState = Characteristic.TargetAirPurifierState.MANUAL;
      }

      targetState = Characteristic.TargetAirPurifierState.AUTO;

      this.log(`Target state is ${targetState}`);
      callback(null, targetState);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  setTargetAirPurifierState(targetState, callback) {
    this.log('setTargetAirPurifierState')
    callback(null)
    // no-op
  }

  getRotationSpeed(callback) {
    this.log('getRotationSpeed')
    // no-op

    callback(null, 80);
  }

  setRotationSpeed(targetState, callback) {
    this.log('setRotationSpeed')
    // no-op
    callback(null)
  }
}
