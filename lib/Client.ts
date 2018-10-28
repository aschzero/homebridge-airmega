import * as request from 'request-promise';

import { Config } from './Config';
import { Logger } from './HALogger';
import { TokenStore } from './TokenStore';
import { Request, Tokens } from './types';

export class Client {
  tokenStore: TokenStore;

  constructor() {
    this.tokenStore = new TokenStore();
  }

  async sendRequest(payload: Request.Payload) {
    Logger.debug('Sending payload', payload);

    let response = await request.post(payload);
    Logger.debug('Response', response);

    return response;
  }

  async buildMessageHeader(endpoint: string): Promise<Request.MessageHeader> {
    let tokens: Tokens = await this.tokenStore.getTokens();

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
        'User-Agent': Config.USER_AGENT,
        'Content-Type': Config.ContentType.FORM,
        Accept: 'application/json'
      },
      json: true,
      form: `message=${encodeURIComponent(JSON.stringify(message))}`
    }

    return payload;
  }
}