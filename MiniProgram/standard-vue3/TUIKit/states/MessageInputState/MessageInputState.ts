import { ref } from 'vue';
import type { Ref } from 'vue';
import { StoreName, TUIChatService, TUIStore } from '../chat-uikit-engine-lite';
import { MessageContentType } from './type';
import { convertInputContentToEditorNode } from './utils';
import type { InputContent } from './type';

/**
 * Message Input Store
 *
 * This store manages the state and operations related to the chat message input, including:
 * - Raw input value (text or structured content)
 * - Editor instance management
 * - Content manipulation (insertion, updating, etc.)
 * - Message sending functionality
 */
interface MessageInputState {
  inputRawValue: Ref<string | InputContent[]>;
  isPeerTyping: Ref<boolean>;
}

interface MessageInputAction {
  updateRawValue: (value: string | InputContent[]) => void;
  setEditorInstance: (editor) => void;
  setContent: (value: string | InputContent[]) => void;
  insertContent: (value: string | InputContent[], focus?: boolean) => void;
  focusEditor: () => void;
  blurEditor: () => void;
  sendMessage: (msg?: string | InputContent[]) => void;
}

const editor = ref(null);
const inputRawValue = ref<string | InputContent[]>('');
const isPeerTyping = ref(false);

/* =====================================================
 * MessageInputActions begin
 * ===================================================== */
const updateRawValue = (value: string | InputContent[]) => {
  if (typeof value !== 'string' && !Array.isArray(value)) {
    console.warn('Invalid input type for updateRawValue');
    return;
  }
  if (typeof value === 'string') {
    inputRawValue.value = value.trim();
  } else {
    inputRawValue.value = value?.length > 0 ? value : '';
  }

  TUIChatService.enterTypingState();
  setTimeout(() => {
    TUIChatService.leaveTypingState();
  }, 3000);
};

const setEditorInstance = (instance) => {
  if (editor.value) {
    editor.value.destroy();
  }
  editor.value = instance;
};

const setContent = (content: string | InputContent[]) => {
  if (!editor.value) {
    return;
  }
  if (typeof content === 'string') {
    editor.value.commands.setContent(content, true);
  } else {
    const editorContent = content.map(convertInputContentToEditorNode);
    editor.value.commands.setContent(editorContent, true);
  }
  editor.value.commands.focus();
};

const insertContent = (content: string | InputContent[], focus = true) => {
  if (!editor.value) {
    return;
  }
  if (typeof content === 'string') {
    editor.value.commands.insertContent(content);
  } else {
    const editorContent = content.map(convertInputContentToEditorNode);
    editor.value.commands.insertContent(editorContent);
  }
  if (focus) {
    editor.value.commands.focus();
  }
};

const focusEditor = () => {
  editor.value?.commands.focus();
};

const blurEditor = () => {
  editor.value?.commands.blur();
};

const sendMessage = async (options) => {
  const { type, content } = options
  if (type === MessageContentType.TEXT) {
    await TUIChatService.sendTextMessage({
      payload: { text: content },
    })
  }

  if (type === MessageContentType.IMAGE) {
    await TUIChatService.sendImageMessage({
      payload: { file: content },
    });
  }

  if (type === MessageContentType.VIDEO) {
    await TUIChatService.sendVideoMessage({
      payload: { file: content },
    });
  }
};

/* =====================================================
 * MessageInputActions end
 * ===================================================== */

function useMessageInputState(): MessageInputState & MessageInputAction {
  return {
    inputRawValue,
    isPeerTyping,
    updateRawValue,
    setEditorInstance,
    setContent,
    insertContent,
    focusEditor,
    blurEditor,
    sendMessage,
  };
}

function initWatcher() {
  TUIStore.watch(StoreName.CHAT, {
    typingStatus: (typingStatus) => {
      isPeerTyping.value = typingStatus;
    },
  });
}

initWatcher();

export { useMessageInputState, MessageContentType };
export type { InputContent };
