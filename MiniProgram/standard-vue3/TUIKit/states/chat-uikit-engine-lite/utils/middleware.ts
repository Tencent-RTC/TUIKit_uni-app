import type { func } from '../type';

class Middleware {
  private cache: func[];
  private middlewares: func[];
  private options: any;
  constructor() {
    this.cache = [];
    this.middlewares = [];
    this.options = null; // 缓存options
  }

  use(fn: func) {
    if (typeof fn !== 'function') {
      console.error('middleware must be a function');
    }
    this.cache.push(fn);
    return this;
  }

  next(): any {
    if (this.middlewares && this.middlewares.length > 0) {
      const ware: any = this.middlewares.shift();
      return ware.call(this, this.options, this.next.bind(this));
    }
    return undefined;
  }

  /**
   * @param {any} options - 数据的入口
   * @returns {Function}
   */
  run(options: any): any {
    this.middlewares = this.cache.map(fn => fn);
    this.options = options; // 缓存数据
    return this.next();
  }
}

export default Middleware;
