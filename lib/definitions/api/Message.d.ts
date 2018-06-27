export interface MessageHeader {
  trcode: string
  accessToken: string
  refreshToken: string
}

export interface Message {
  header: MessageHeader
  body: object
}