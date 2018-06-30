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
  on: boolean;
  lightOn: boolean;
  fanSpeed: number;
  auto: boolean;
}