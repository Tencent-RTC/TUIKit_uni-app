/**
 * @interface TUIGlobal
*/
export interface ITUIGlobal {
  global: any; // 挂在 wx、uni、window 对象
  isOfficial: boolean;
  [key: string]: any;

  initOfficial(isOfficial: boolean): void;

  getPlatform(): string;
}
