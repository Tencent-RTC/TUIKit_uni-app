import { TUIBridge } from '../TUIBridge';
import { EVENT } from '../constants/event';

/**
 * Returns true when the Call kit has wired itself into the shared TUIBridge
 * (i.e. at least one listener is registered for the On_Calls event).
 *
 * The chat UI uses this to decide whether to broadcast the On_Calls event
 * or to fall back to a local "not integrated" hint, so projects that do not
 * install `@tencentcloud/calls-uikit-wx-uniapp-engine` get a clear message
 * instead of a silent no-op.
 */
export function isCallIntegrated(): boolean {
  return TUIBridge.hasEventListener(EVENT.ON_CALLS);
}
