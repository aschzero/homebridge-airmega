interface PurifierMetadataProperties {
  productId: string;
  aliasName: string;
}

interface PurifierProperties {
  power: boolean;
  fanSpeed: number;
  mode: number;
  mood: number;
  dustPollutionLev: number;
  filter1ExchAlarm: boolean;
  filter2ExchAlarm: boolean;
}

interface FilterProperties {
  prefilter: number;
  hepafilter: number;
  filterIndicator: boolean;
}

export { FilterProperties, PurifierMetadataProperties, PurifierProperties }