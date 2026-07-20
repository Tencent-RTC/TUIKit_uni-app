import type { ICustomStore } from '../../interface/store';

export default class CustomStore implements ICustomStore {
  public store: any;

  constructor() {
    this.store = {};
  }

  update(key: string, data: any) {
    this.store[key] = data;
  }

  getData(key: string) {
    return this.store[key];
  }

  reset(keyList: string[] = []) {
    if (keyList.length === 0) {
      this.store = {};
    }
    this.store = {
      ...this.store,
      ...keyList.reduce((acc, key) => ({ ...acc, [key]: undefined }), {}),
    };
  }
}
