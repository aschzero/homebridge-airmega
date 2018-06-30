# homebridge-airmega

Control and monitor your Airmega purifier with HomeKit integration.

⚠️ **Please note**: this version of the plugin does not currently work due to a sudden switch-over to new APIs and a new app (IOCare). A [new version](https://github.com/aschzero/homebridge-airmega/tree/2.1.0) of the plugin is under development and should be released soon. In the meantime, you can install and try out the latest beta with `npm install -g homebridge-airmega@beta`.

## Prerequisites

* Working installation of [Homebridge](https://github.com/nfarina/homebridge)
* iOS 11 or later
* Airmega 400S/300S connected to WiFi
    * Only the 400S has been tested but the 300S should also work fine.

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
    "username": "CD:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-156"
  },
  "platforms": [
    {
      "platform": "Airmega",
      "email": "my@email.com",
      "password": "password123"
    }
  ]
}
```

The plugin will discover all connected purifiers when homebridge is restarted.

### Required Fields
* **platform** - Set to "Airmega"
* **email** - The email you use to log into the Airmega app
* **password** - The password you use to log into the Airmega app

## Functionality

* Turn on/off
* Fan speed adjustment
* Toggle between manual and auto mode
* Reports air quality
* Reports change indication and life levels of both filters (only visible in the Elgato Eve app)
* Includes a light accessory to control the lights on the purifier

## Tested Siri Commands

These commands have been known to work:

* "Turn the air purifier on"
* "Turn the air purifier off"
* "Set the air purifier to auto"
* "Set the air purifier to manual"
* "Set the air purifier fan to 50%"
* "What's the air quality in \<room name\>?"

Multiple air purifiers can be differentiated by replacing the phrase "air purifier" with its name.