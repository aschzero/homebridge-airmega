import * as store from 'store';

import { Authenticator } from './Authenticator';
import { Logger } from './Logger';
import { TokenPair } from './types';

export class TokenStore {
  static readonly TOKEN_KEY = 'tokens';
  static readonly CREDENTIAL_KEY = 'credentials';
  static readonly TOKEN_EXP_LENGTH = 3600000;

  saveTokens(tokens: TokenPair): void {
    tokens.storedAt = Date.now();

    store.set(TokenStore.TOKEN_KEY, tokens);
  }

  async getTokens(): Promise<TokenPair> {
    let tokens = store.get(TokenStore.TOKEN_KEY);

    if (!this.isExpired()) {
      return tokens;
    }

    Logger.log('Auth tokens are expired, refreshing...');

    try {
      let authenticator = new Authenticator();
      let newTokens = await authenticator.refreshTokens(tokens);

      this.saveTokens(newTokens);

      Logger.log('Token refresh succeeded!');
      Logger.debug('New tokens', newTokens); // remove
    } catch(e) {
      Logger.error('Unable to refresh tokens', e);
    }
  }

  isExpired(): boolean {
    let tokens: TokenPair = store.get('tokens');

    return (Date.now() - tokens.storedAt) >= TokenStore.TOKEN_EXP_LENGTH;
  }
}