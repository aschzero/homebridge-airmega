import { PurifierMetadataProperties } from './Purifier';

export interface AuthenticationResult {
  userToken: string;
  purifiers: PurifierMetadataProperties[];
}
