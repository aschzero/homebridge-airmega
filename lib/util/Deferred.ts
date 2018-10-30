export class Deferred<T> implements Promise<T> {
  private resolveSelf;
  private rejectSelf;
  private promise: Promise<T>;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolveSelf = resolve
      this.rejectSelf = reject
    });
  }

  public then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) =>
    TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) =>
    TResult2 | PromiseLike<TResult2>) | undefined | null
    ): Promise<TResult1 | TResult2> {
      return this.promise.then(onfulfilled, onrejected)
    }

  public catch<TResult = never>(
    onrejected?: ((reason: any) =>
    TResult | PromiseLike<TResult>) | undefined | null
    ): Promise<T | TResult> {
      return this.promise.then(onrejected)
    }

  public resolve(val?:T) { this.resolveSelf(val) }
  public reject(reason:any) { this.rejectSelf(reason) }

  [Symbol.toStringTag]: 'Promise'
}