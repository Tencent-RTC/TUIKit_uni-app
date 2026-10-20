/**
 * 录制启停确认弹窗状态（recording 域内部共享）
 *
 * 录制按钮在底部工具栏、录制浮层在页面顶部，两者分处不同子树，无法用 props / emit 互通，
 * 因此在本域内共享一份弹窗状态：两者都可发起请求，由 RecordingButton 渲染弹窗并执行启停。
 */

import { reactive } from 'vue';

export type RecordingConfirmMode = 'start' | 'stop';

export interface RecordingConfirmState {
  visible: boolean;
  mode: RecordingConfirmMode;
  title: string;
  message: string;
  confirmText: string;
}

export const recordingConfirmState = reactive<RecordingConfirmState>({
  visible: false,
  mode: 'start',
  title: '',
  message: '',
  confirmText: '',
});

/** 请求"开始录制"确认（由录制按钮发起） */
export function requestStartRecording(): void {
  recordingConfirmState.visible = true;
  recordingConfirmState.mode = 'start';
}

/** 请求"停止录制"确认（录制按钮或录制浮层发起） */
export function requestStopRecording(): void {
  recordingConfirmState.visible = true;
  recordingConfirmState.mode = 'stop';
}

export function closeRecordingConfirm(): void {
  recordingConfirmState.visible = false;
}
