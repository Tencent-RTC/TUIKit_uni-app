// @ts-nocheck
import Vue from 'vue';
import { StoreName, TUIChatService, TUIStore } from '../chat-uikit-engine-lite';
import { MessageContentType } from './type';
import { convertInputContentToEditorNode } from './utils';
import type { InputContent } from './type';

interface MessageInputState {
  inputRawValue: string | InputContent[];
  isPeerTyping: boolean;
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

const state = Vue.observable({
  editor: null,
  inputRawValue: '' as string | InputContent[],
  isPeerTyping: false,
});

const updateRawValue = (value: string | InputContent[]) => {
  if (typeof value !== 'string' && !Array.isArray(value)) {
    console.warn('updateRawValue 的输入类型无效');
    return;
  }
  if (typeof value === 'string') {
    state.inputRawValue = value.trim();
  } else {
    state.inputRawValue = value?.length > 0 ? value : '';
  }

  TUIChatService.enterTypingState();
  setTimeout(() => {
    TUIChatService.leaveTypingState();
  }, 3000);
};

const setEditorInstance = (instance) => {
  if (state.editor) {
    state.editor.destroy();
  }
  state.editor = instance;
};

const setContent = (content: string | InputContent[]) => {
  if (!state.editor) {
    return;
  }
  if (typeof content === 'string') {
    state.editor.commands.setContent(content, true);
  } else {
    const editorContent = content.map(convertInputContentToEditorNode);
    state.editor.commands.setContent(editorContent, true);
  }
  state.editor.commands.focus();
};

const insertContent = (content: string | InputContent[], focus = true) => {
  if (!state.editor) {
    return;
  }
  if (typeof content === 'string') {
    state.editor.commands.insertContent(content);
  } else {
    const editorContent = content.map(convertInputContentToEditorNode);
    state.editor.commands.insertContent(editorContent);
  }
  if (focus) {
    state.editor.commands.focus();
  }
};

const focusEditor = () => {
  state.editor?.commands.focus();
};

const blurEditor = () => {
  state.editor?.commands.blur();
};

const sendMessage = async (options) => {
  const { type, content } = options;
  if (type === MessageContentType.TEXT) {
    await TUIChatService.sendTextMessage({
      payload: { text: content },
    });
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


function useMessageInputState(): MessageInputState & MessageInputAction {
  return {
    get inputRawValue() {
      return state.inputRawValue;
    },
    get isPeerTyping() {
      return state.isPeerTyping;
    },
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
      state.isPeerTyping = typingStatus;
    },
  });
}

initWatcher();

export { useMessageInputState, MessageContentType };
export type { InputContent };