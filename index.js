var Accessory, Service, Characteristic, UUIDGen;

module.exports = (homebridge) => {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  AirmegaAccessory = require('./src/AirmegaAccessory')(Accessory, Service, Characteristic);
  AirmegaPlatform = require('./src/AirmegaPlatform')(UUIDGen, Accessory, AirmegaAccessory);

  homebridge.registerPlatform('homebridge-airmega', 'Airmega', AirmegaPlatform, true);
};
