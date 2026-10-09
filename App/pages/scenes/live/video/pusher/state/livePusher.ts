import { reactive } from 'vue';

/**
 * Anchor / pusher side local state.
 * Mirrors Android `pusherview/PusherStore.kt` (liveStatus: PREPARE / PUSHER / SUMMARY).
 * The page root switches between three UI sets by `liveStatus`.
 */

enum LivePusherStatus {
  PREPARE = 'PREPARE',
  PUSHER = 'PUSHER',
  SUMMARY = 'SUMMARY',
}

interface LivePusherState {
  liveStatus: LivePusherStatus;
  liveID: string;
  roomID: string;
}

const livePusher = reactive<LivePusherState>({
  liveStatus: LivePusherStatus.PREPARE,
  liveID: '',
  roomID: '',
});

function useLivePusher(): LivePusherState {
  return livePusher;
}

export { LivePusherStatus, livePusher, useLivePusher };
export type { LivePusherState };
