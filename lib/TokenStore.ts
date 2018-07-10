import * as store from 'store';

import { Authenticator } from './Authenticator';
import { Config } from './Config';
import { Logger } from './HALogger';
import { Tokens } from './types';

export class TokenStore {
  static readonly TOKEN_KEY = 'tokens';
  static readonly CREDENTIAL_KEY = 'credentials';
  static readonly TOKEN_EXP = 3600000;

  setTokens(data: any): void {
    data.storedAt = Date.now()

    store.set(TokenStore.TOKEN_KEY, data);
  }

  async getTokens(): Promise<Tokens> {
    if (this.isExpired()) {
      Logger.log('Tokens expired, refreshing...');

      try {
        let authenticator = new Authenticator();
        await authenticator.authenticate();
        Logger.log('Token refresh succeeded');
      } catch(e) {
        Logger.log(`Unable to reauthenticate: ${e}`)
      }
    }

    return store.get(TokenStore.TOKEN_KEY);
  }

  isExpired(): boolean {
    let tokens: Tokens = store.get('tokens');
    let now = Date.now();

    return (now - tokens.storedAt) >= TokenStore.TOKEN_EXP;
  }
}