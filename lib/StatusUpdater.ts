import { Deferred } from './Deferred';

export class StatusUpdater<T> {
  private deferred: Deferred<T>;
  private locked: boolean;

  constructor() {
    this.deferred = new Deferred<T>();
    this.locked = false;
  }

  async wait(task: () => Promise<T>): Promise<T> {
    if (this.locked) {
      let result = await this.deferred;
      return result;
    }

    this.locked = true;

    try {
      let result = await task();
      this.deferred.resolve(result);

      return result;
    } catch(e) {
      this.deferred.reject(e);
      throw new Error(e);
    } finally {
      this.resetLock();
    }
  }

  private resetLock(): void {
    setTimeout(() => {
      this.deferred = new Deferred<T>();
      this.locked = false;
    }, 1000);
  }
}
