/**
 * 房间生命周期编排（state 模块内部使用，不对外暴露）。
 *
 * 子 state 实现 {@link RoomLifecycleHooks} 后通过 {@link registerRoomLifecycle}
 * 注册，即可在 RoomState 编排进/退房时被回调：
 *   1. 进房前广播 beforeEnterRoom(roomID)，用于注册 observer、绑定 roomID
 *   2. 进房成功后广播 afterEnterRoom(info)，用于基于房间信息初始化状态
 *   3. 退房后广播 didLeaveRoom(roomID)，用于解绑 observer、清空状态
 *
 * 钩子内禁止抛错；广播器会 catch 并 warn 但不会中断后续广播。
 *
 * @internal
 */

/**
 * 房间生命周期钩子。三个钩子全部可选，子 state 只关心自己需要的时机即可实现。
 *
 * `afterEnterRoom` 的 `info` 定为 `any`，便于不同业务场景传入不同形状的对象；
 * 订阅方在实现里自行按所需形状取字段或做类型断言。
 *
 * @internal
 */
export interface RoomLifecycleHooks {
  beforeEnterRoom?(roomID: string): void;
  afterEnterRoom?(info: any): void;
  didLeaveRoom?(roomID: string): void;
}

const lifecycleSubscribers = new Set<RoomLifecycleHooks>();

/**
 * 子 state 自注册入口。幂等：同一实例重复注册不会重复触发。
 * @internal
 */
export function registerRoomLifecycle(target: RoomLifecycleHooks): void {
  lifecycleSubscribers.add(target);
}

/**
 * 取消注册。仅用于测试或按需销毁子 state 场景。
 * @internal
 */
export function unregisterRoomLifecycle(target: RoomLifecycleHooks): void {
  lifecycleSubscribers.delete(target);
}

function safeInvokeLifecycle(label: string, fn: () => void): void {
  try {
    fn();
  } catch (e) {
    console.error(`[RoomLifecycle] subscriber threw in ${label}:`, e);
  }
}

/**
 * 房间生命周期广播器，供 RoomState 内部编排使用。
 * @internal
 */
export const roomLifecycle = {
  beforeEnterRoom(roomID: string): void {
    lifecycleSubscribers.forEach((s) => {
      if (s.beforeEnterRoom) safeInvokeLifecycle('beforeEnterRoom', () => s.beforeEnterRoom!(roomID));
    });
  },
  afterEnterRoom(info: any): void {
    lifecycleSubscribers.forEach((s) => {
      if (s.afterEnterRoom) safeInvokeLifecycle('afterEnterRoom', () => s.afterEnterRoom!(info));
    });
  },
  didLeaveRoom(roomID: string): void {
    lifecycleSubscribers.forEach((s) => {
      if (s.didLeaveRoom) safeInvokeLifecycle('didLeaveRoom', () => s.didLeaveRoom!(roomID));
    });
  },
};
