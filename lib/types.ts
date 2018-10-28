export namespace HAP {
  export interface Accessory {
    UUID: string;

    on(...args: any[]): void;
    getService(...args: any[]): Service;
    addService(...args: any[]): Service;
    getServiceByUUIDAndSubType(...args: any[]): Service;
    updateReachability(reachable: boolean): void;
  }

  export interface Service {
    AccessoryInformation: void;

    setCharacteristic(...args: any[]): Service;
    getCharacteristic(...args: any[]): Characteristic;
  }

  export interface Characteristic {
    on(...args: any[]): Characteristic;
  }

  export interface Log {
    (...args: any[]): void;
    error(...args: any[]): void;
  }

  export interface AccessoryConfig {
    error(...args: any[]): void
  }

  export interface Platform {
    on(...args: any[]): void
    registerPlatformAccessories(...args: any[]): void
  }
}

export interface Tokens {
  accessToken: string
  refreshToken: string
  storedAt?: number
}

export namespace Request {
  export interface MessageHeader {
    trcode: string
    accessToken: string
    refreshToken: string
  }

  export interface Message {
    header: MessageHeader
    body: object
  }

  export interface Payload {
    uri: string
    method: string
    headers: any
    json: boolean
    form: string
  }

  export interface OAuthPayload {
    uri: string
    headers: any
    qs: any
    resolveWithFullResponse?: boolean
  }

  export interface AuthenticatePayload {
    uri: string
    method: string
    headers: any
    json: boolean
    body: AuthenticateBodyPayload
  }

  export interface AuthenticateBodyPayload {
    username: string
    password: string
    state: string
    auto_login: string
  }
}

export namespace Purifier {
  export enum Power {
    On = '1',
    Off = '0'
  }

  export enum Light {
    On = '2',
    Off = '0'
  }

  export enum Fan {
    Low = '1',
    Medium = '2',
    High = '3'
  }

  export enum State {
    Manual = '0',
    Auto = '1',
    Sleep = '2',
    AutoSleep = '6'
  }

  export enum AirQuality {
    Excellent = '1',
    Good = '2',
    Fair = '3',
    Inferior = '4'
  }

  export interface Status {
    power: Power
    light: Light
    fan: Fan
    state: State
    airQuality: AirQuality
  }

  export interface FilterStatus {
    name: string
    lifeLevel: number
  }

  export interface Metadata {
    nickname: string
    barcode: string
  }
}