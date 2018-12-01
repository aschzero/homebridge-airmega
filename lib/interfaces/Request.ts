export interface MessageHeader {
  trcode: string;
  accessToken: string;
  refreshToken: string;
}

export interface Message {
  header: MessageHeader;
  body: any;
}

export interface Payload {
  uri: string;
  headers: any;
  json: boolean;
  form: string;
}

export interface OAuthPayload {
  uri: string;
  headers: any;
  qs: any;
  resolveWithFullResponse?: boolean;
}

export interface AuthenticatePayload {
  uri: string;
  method: string;
  headers: any;
  json: boolean;
  body: AuthenticateBodyPayload;
}

export interface AuthenticateBodyPayload {
  username: string;
  password: string;
  state: string;
  auto_login: string;
}