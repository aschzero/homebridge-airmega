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
      .on('get', this.getTargetAirPurifierState.bind(this))
      .on('set', this.setTargetAirPurifierState.bind(this));

    purifierService
      .getCharacteristic(Characteristic.RotationSpeed)
      .on('get', this.getRotationSpeed.bind(this))
      .on('set', this.setRotationSpeed.bind(this));

    this.informationService = informationService;
    this.purifierService = purifierService;

    return [informationService, purifierService];
  }

  getActiveCharacteristic(callback) {
    if (this.device == null) return;
    if (!this.device.hasLatestData) return;

    this.log('getActiveCharacteristic')

    if (this.device.latestData.power) {
      this.log('Airmega is on');
      callback(null, Characteristic.Active.ACTIVE);
    } else {
      this.log('Airmega is off');
      callback(null, Characteristic.Active.INACTIVE);
    }
  }

  setActiveCharacteristic(targetState, callback) {
    if (this.device == null) return;

    this.log('setActiveCharacteristic')

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
    if (!this.device.hasLatestData) return;

    this.log('getCurrentAirPurifierState')    
    
    let currentState;
    let data = this.device.latestData;

    currentState = Characteristic.CurrentAirPurifierState.PURIFYING_AIR;    

    if (!data.power) {
      currentState = Characteristic.CurrentAirPurifierState.INACTIVE;
    }

    if (data.fanSpeed == 0 || data.mode == 2) {
      currentState = Characteristic.CurrentAirPurifierState.IDLE;
    }

    this.log(`Current state is ${currentState}`);
    callback(null, currentState);
  }

  getTargetAirPurifierState(callback) {
    if (this.device == null) return;
    if (!this.device.hasLatestData) return;

    this.log('getTargetAirPurifierState')        
    
    let targetState;
    let data = this.device.latestData;  

    if (data.mode == 0) {
      targetState = Characteristic.TargetAirPurifierState.MANUAL;
    } else {
      targetState = Characteristic.TargetAirPurifierState.AUTO;      
    }

    this.log(`Target state is ${targetState}`);
    callback(null, targetState);
  }

  setTargetAirPurifierState(targetState, callback) {
    this.device.setFanSpeed(targetState ? -1 : 1).then(() => {
      this.log(`Set target state to ${targetState}`);   
      callback(null);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }

  getRotationSpeed(callback) {
    if (this.device == null) return;
    if (!this.device.hasLatestData) return;
    this.log('getRotationSpeed')

    let intervals = {
      1: 20,
      2: 50,
      3: 100
    }

    let fanSpeed = intervals[this.device.latestData.fanSpeed];
    
    this.log(`Rotation speed is ${fanSpeed}`);
    callback(null, fanSpeed);
  }

  setRotationSpeed(targetState, callback) {
    if (this.device == null) return;

    let targetSpeed;
    let intervals = {
      1: [0, 40],
      2: [40, 70],
      3: [70, 100]
    }

    for (var key in intervals) {
      var currentSpeed = intervals[key];

      if (targetState > currentSpeed[0] && targetState <= currentSpeed[1]) {
        targetSpeed = key;
        break;
      }
    }

    this.log(`Setting rotation speed to ${targetSpeed}`);

    this.device.setFanSpeed(targetSpeed).then(() => {
      self.purifierService.setCharacteristic(Characteristic.TargetAirPurifierState, Characteristic.TargetAirPurifierState.MANUAL);

      callback(null);
    }).catch((err) => {
      this.log(err);
      callback(err);
    });
  }
}
