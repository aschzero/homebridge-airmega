export interface Payload {
  uri: string
  method: string
  headers: any
  json: boolean
  form: string
}

export interface OAuthPayload {
  uri: string
  method: string
  headers: any
  qs: any
  resolveWithFullResponse: boolean
}

export interface AuthenticatePayload {
  uri: string
  method: string
  headers: any
  json: boolean
  resolveWithFullResponse: boolean
  body: AuthenticateBodyPayload
}

export interface AuthenticateBodyPayload {
  username: string
  password: string
  state: string
  auto_login: string
}