import { ref } from 'vue';

const visible = ref(false);
const title = ref('');
const position = ref('center');
const showSeq = ref(0);

const showLiveToast = (text: string, pos: string = 'center') => {
  if (!text || !text.trim()) return;
  title.value = text;
  position.value = pos || 'center';
  visible.value = true;
  showSeq.value++;
};

const hideLiveToast = () => {
  visible.value = false;
};

export { visible, title, position, showSeq, showLiveToast, hideLiveToast };
