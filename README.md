# homebridge-airmega

Control and monitor your Airmega purifier with HomeKit integration.

![Screenshot of Home app](https://i.imgur.com/l6VHms4.jpg)
![Screenshot of Elgato Eve app](https://i.imgur.com/kYXgx3u.png)

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
  "accessories": [
    {
      "accessory": "Airmega",
      "name": "Air Purifier",
      "device_name": "Bedroom",
      "email": "my@email.com",
      "password": "password123"
    }
  ]
}
```

## Functionality

* Turn on/off
* Fan speed adjustment
* Toggle between manual and auto mode
* Reports air quality
* Reports change indication and life levels of both filters  
