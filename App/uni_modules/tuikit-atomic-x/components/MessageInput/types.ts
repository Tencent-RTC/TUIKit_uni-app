import img1 from './assets/nvue_image.png';
import img2 from './assets/nvue_camera.png';

export interface ToolItem {
  id: string;
  name: string;
  icon: string;
  callback?: () => void;
}

export const DEFAULT_TOOLS: ToolItem[] = [
  { id: 'image', name: '照片', icon: img1 },
  { id: 'video', name: '视频', icon: img2 },
];
