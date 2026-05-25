export interface ToolItem {
  id: string;
  name: string;
  icon: string;
  callback?: () => void;
}

export const DEFAULT_TOOLS: ToolItem[] = [
  { id: 'image', name: '照片', icon: '/uni_modules/tuikit-atomic-x/static/assets/message-input/nvue_image.png' },
  { id: 'video', name: '视频', icon: '/uni_modules/tuikit-atomic-x/static/assets/message-input/nvue_camera.png' },
  { id: 'file', name: '文件', icon: '/uni_modules/tuikit-atomic-x/static/assets/message-input/file.png' },
  { id: 'voiceCall', name: '语音通话', icon: '/uni_modules/tuikit-atomic-x/static/assets/message-input/voice.png' },
  { id: 'videoCall', name: '视频通话', icon: '/uni_modules/tuikit-atomic-x/static/assets/message-input/video.png' },
];
