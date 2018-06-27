export interface Payload {
  uri: string
  method: string
  headers: any
  json: boolean
}

export interface FormPayload extends Payload {
  form: string
}

export interface AuthenticatorPayload extends Payload {
  resolveWithFullResponse: boolean
  body: any
}
