export interface Log {
  (...args: any[]): void
  error(...args: any[]): void
}
