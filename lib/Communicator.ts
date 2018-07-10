import * as request from 'request-promise';
import * as store from 'store';

import { Config } from './Config';
import { Logger } from './HALogger';
import { Request, TokenStore } from './types';
import { Authenticator } from './Authenticator';

export class Communicator {
  authenticator: Authenticator;

  constructor() {
    this.authenticator = new Authenticator();
  }

  async sendRequest(payload: Request.Payload) {
    if (this.authenticator.tokenExpired()) {
      Logger.log('Tokens expired, refreshing...');

      try {
        await this.authenticator.authenticate();
        Logger.log('Successfully refreshed tokens');
      } catch(e) {
        Logger.log(`Unable to reauthenticate: ${e}`)
      }
    }

    Logger.debug('Sending payload', payload);

    let response = await request(payload);
    Logger.debug('Response', response);

    return response;
  }

  buildMessageHeader(endpoint: string): Request.MessageHeader {
    let tokens: TokenStore = store.get('tokens');

    let header: Request.MessageHeader = {
      trcode: endpoint,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }

    return header;
  }

  buildPayload(endpoint: string, message: Request.Message): Request.Payload {
    let payload: Request.Payload = {
      uri: `${Config.BASE_URI}/${endpoint}.json`,
      headers: {
        'Content-Type': Config.ContentType.FORM,
        'User-Agent': Config.USER_AGENT
      },
      method: 'POST',
      json: true,
      form: `message=${encodeURIComponent(JSON.stringify(message))}`
    }

    return payload;
  }
}