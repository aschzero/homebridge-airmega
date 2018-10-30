# homebridge-airmega

Control and monitor your Airmega purifier with HomeKit integration.

[![npm version](http://img.shields.io/npm/v/homebridge-airmega.svg)](https://npmjs.org/package/homebridge-airmega)

## Functionality

* Control power, fan speed, and lights
* Toggle between manual and auto mode
* Reports the current air quality
* Reports remaining life level of both filters

## Prerequisites

* Installation of [Homebridge](https://github.com/nfarina/homebridge)
* iOS 11 or later
* Airmega 400S or 300S connected to WiFi and registered with the IOCare app

## Installation

```
npm install -g homebridge-airmega
```

## Configuration

Example homebridge configuration file:

```
{
  "bridge": {
    "name": "Homebridge",
    "username": "XX:XX:XX:XX:XX:XX",
    "port": 51826,
    "pin": "XXX-XX-XXX"
  },
  "platforms": [
    {
      "platform": "Airmega",
      "username": "myusername",
      "password": "password123"
    }
  ]
}
```

The plugin will discover all connected purifiers when homebridge is restarted.

### Authentication

The IOCare app offers two main options for logging in: "Phone Number/Email" or "Coway ID". The username and password you supply in the config has been tested to work with either one. This plugin currently does not support authentication through social networks.

## Tested Siri Commands

Example of some Siri commands you can use:

* "Turn the air purifier on"
* "Turn the air purifier off"
* "Set the air purifier to auto"
* "Set the air purifier to manual"
* "Set the air purifier fan to 50%"
* "What's the air quality in \<room name\>?"

