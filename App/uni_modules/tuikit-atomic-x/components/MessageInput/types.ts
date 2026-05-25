import imageIcon from '../../static/assets/message-input/nvue_image.png';
import cameraIcon from '../../static/assets/message-input/nvue_camera.png';
import videoIcon from '../../static/assets/message-input/video.png';
import voiceIcon from '../../static/assets/message-input/voice.png';
import fileIcon from '../../static/assets/message-input/file.png';

export interface ToolItem {
  id: string;
  name: string;
  icon: string;
  callback?: () => void;
}

export const DEFAULT_TOOLS: ToolItem[] = [
  { id: 'image', name: '照片', icon: imageIcon },
  { id: 'video', name: '视频', icon: cameraIcon },
  { id: 'file', name: '文件', icon: fileIcon },
  { id: 'voiceCall', name: '语音通话', icon: voiceIcon },
  { id: 'videoCall', name: '视频通话', icon: videoIcon },
  
];
