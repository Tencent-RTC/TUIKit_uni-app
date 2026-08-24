/**
 * 关键指标上报（KeyMetricsStats）。
 */

// @ts-ignore - UTS module
import { hybirdCallExperimentalAPI } from '@/uni_modules/tuikit-atomic-x';

export const KeyMetricsKey = {
  T_METRICS_STATE_ROOM_STATE_COUNT: 192430,
  T_METRICS_STATE_API_CREATE_ROOM_COUNT: 192431,
  T_METRICS_STATE_API_JOIN_ROOM_COUNT: 192432,
  T_METRICS_STATE_API_START_RECORDING_COUNT: 192440,
  T_METRICS_STATE_API_STOP_RECORDING_COUNT: 192441,
  T_METRICS_STATE_API_DEVICE_START_SCREEN_SHARE_COUNT: 192463,
  T_METRICS_STATE_ASR_STATE_COUNT: 192400,
  T_METRICS_STATE_API_START_WHITEBOARD_COUNT: 192480,
  T_METRICS_STATE_DEVICE_STATE_COUNT: 192460,
  T_METRICS_STATE_API_DEVICE_OPEN_LOCAL_MICROPHONE_COUNT: 192461,
  T_METRICS_STATE_API_DEVICE_OPEN_LOCAL_CAMERA_COUNT: 192462,
  T_METRICS_STATE_ROOM_PARTICIPANT_STATE_COUNT: 192420
} as const;

export function reportKeyMetrics(key: number): void {
  try {
    // @ts-ignore
    hybirdCallExperimentalAPI({
      jsonData: JSON.stringify({
        api: 'KeyMetricsStats',
        params: { key },
      }),
    });
  } catch (e) {
    console.warn('[KeyMetrics] report failed:', key, e);
  }
}
