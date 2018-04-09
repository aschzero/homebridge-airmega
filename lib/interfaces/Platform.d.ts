export interface Platform {  
  on(...args: any[]): void
  registerPlatformAccessories(...args: any[]): void
}
