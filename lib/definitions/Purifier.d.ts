export interface PurifierMetadata {
  nickname: string;
  barcode: string;
}

export interface FilterProperties {
  prefilter: number;
  hepafilter: number;
  filterIndicator: boolean;
}

export interface PurifierStatus {
  power: boolean;
  fanSpeed: number;
  mode: number;
  mood: number;
  dustPollutionLev: number;
  filter1ExchAlarm: boolean;
  filter2ExchAlarm: boolean;
}