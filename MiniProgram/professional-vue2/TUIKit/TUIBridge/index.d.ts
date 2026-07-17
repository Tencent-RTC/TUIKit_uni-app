type func = (...args: any[]) => any;
/**
 * Broadcast parameter information
 * @interface NotifyEventParams
 * @property {string} eventName event name
 * @property {string} method method name to call
 * @property {Record<string, any>} params business parameters
 * @property {func} [callback] callback function
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
     * Register broadcast listener
     * @function
     * @param {string} eventName event name
     * @param {TUINotification} notification event listener
     * @example
     * TUICore.registerEvent('LoginState.LoginSuccess', this);
    */
    registerEvent(eventName: string, notification: TUINotification): void;
    /**
     * Unregister broadcast listener
     * @function
     * @param {string} eventName event name
     * @param {ITUINotification} notification event listener
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
