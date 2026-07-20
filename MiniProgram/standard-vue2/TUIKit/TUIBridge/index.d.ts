type func = (...args: any[]) => any;
/**
 * 广播参数信息
 * @interface NotifyEventParams
 * @property {string} eventName 事件名
 * @property {string} method 调用的方法名
 * @property {Record<string, any>} params 业务参数
 * @property {func} [callback] 回调函数
*/
interface NotifyEventParams {
    eventName: string;
    params?: Record<string, any>;
    callback?: func;
}

interface TUINotification {
    onNotifyEvent(options: NotifyEventParams): void;
}

/**
 * @interface TUIBridge
*/
interface TUIBridge {
    /**
     * 注册广播监听
     * @function
     * @param {string} eventName 事件名
     * @param {string} subKey 事件的具体操作
     * @param {TUINotification} notification 事件监听者
     * @example
     * TUICore.registerEvent('LoginState.LoginSuccess', this);
    */
    registerEvent(eventName: string, notification: TUINotification): void;
    /**
     * 反注册广播监听
     * @function
     * @param {string} eventName 事件名
     * @param {string} subKey 事件的具体操作
     * @param {ITUINotification} notification 事件监听者
     * @example
     * TUICore.unregisterEvent('LoginState.LoginSuccess', this);
    */
    unregisterEvent(eventName: string, notification: TUINotification): void;
    /**
     * Broadcast a notification to all listeners registered for the event.
     * @function
     * @param {NotifyEventParams} options notification payload
     * @example
     * TUICore.notifyEvent({
     *    eventName: LoginState.LoginSuccess,
     *    params: { chat },
     * });
    */
    notifyEvent(options: NotifyEventParams): void;
    /**
     * Check whether at least one listener has been registered for the given
     * event name. Use this from the broadcast side to detect whether a peer
     * module (e.g. the Call kit) is actually wired up before firing events
     * that would otherwise be silently dropped.
     * @function
     * @param {string} eventName event name to query
     * @returns {boolean} true if there is at least one active listener
     * @example
     * if (TUIBridge.hasEventListener(EVENT.ON_CALLS)) {
     *     TUIBridge.notifyEvent({ eventName: EVENT.ON_CALLS, params });
     * }
    */
    hasEventListener(eventName: string): boolean;
}

declare const tuiBridge: TUIBridge;

export { tuiBridge as TUIBridge, tuiBridge as default };
