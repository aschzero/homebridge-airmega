import { PurifierResponse } from './types';

export class Purifier {
  id: string;
  name: string;
  power: PurifierResponse.Power;
  light: PurifierResponse.Light;
  fan: PurifierResponse.Fan;
  state: PurifierResponse.State;
  airQuality: PurifierResponse.AirQuality;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  setStatus(status: PurifierResponse.Status): void {
    this.power = status.power;
    this.light = status.light;
    this.fan = status.fan;
    this.state = status.state;
    this.airQuality = status.airQuality;
  }
}