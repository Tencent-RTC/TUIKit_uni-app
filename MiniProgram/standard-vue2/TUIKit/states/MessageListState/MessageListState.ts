// @ts-nocheck
import Vue from 'vue';
import {
  TUIStore,
  StoreName,
  TUIChatService,
} from '../chat-uikit-engine-lite';
import type { IMessageModel as MessageModel } from '../chat-uikit-engine-lite';

interface MessageListState {
  activeConversationID: string | undefined;
  messageList: readonly MessageModel[] | undefined;
  hasMoreOlderMessage: boolean | undefined;
  hasMoreNewerMessage: boolean | undefined;
  enableReadReceipt: boolean | undefined;
  isDisableScroll: boolean | undefined;
  recalledMessageIDSet: Set<string>;
  highlightMessageIDSet: Set<string>;
}

interface MessageListBusinessAction {
  loadMoreOlderMessage: () => Promise<void>;
  setEnableReadReceipt: (enableReadReceipt: boolean | undefined) => void;
  setIsDisableScroll: (isDisableScroll: boolean) => void;
  highlightMessage: ({ messageID, duration }: { messageID: string; duration: number }) => void;
}

let prevConversationID: string | undefined;

const state = Vue.observable({
  activeConversationID: undefined as string | undefined,
  messageList: undefined as readonly MessageModel[] | undefined,
  hasMoreOlderMessage: undefined as boolean | undefined,
  hasMoreNewerMessage: undefined as boolean | undefined,
  enableReadReceipt: undefined as boolean | undefined,
  isDisableScroll: undefined as boolean | undefined,
  recalledMessageIDSet: new Set() as Set<string>,
  highlightMessageIDSet: new Set() as Set<string>,
});

function initialState() {
  state.activeConversationID = undefined;
  state.messageList = undefined;
  state.hasMoreOlderMessage = undefined;
  state.hasMoreNewerMessage = undefined;
  state.enableReadReceipt = undefined;
  state.isDisableScroll = undefined;
  state.recalledMessageIDSet = new Set();
  state.highlightMessageIDSet = new Set();
}

function setEnableReadReceipt(_enableReadReceipt: boolean | undefined): void {
  state.enableReadReceipt = _enableReadReceipt;
}

function setIsDisableScroll(_isDisableScroll: boolean): void {
  state.isDisableScroll = _isDisableScroll;
}

function highlightMessage({ messageID, duration }: { messageID: string; duration: number }): void {
  state.highlightMessageIDSet.add(messageID);
  setTimeout(() => {
    state.highlightMessageIDSet.delete(messageID);
  }, duration);
}

function useMessageListState(): MessageListState & MessageListBusinessAction {
  return {
    get activeConversationID() {
      return state.activeConversationID;
    },
    get messageList() {
      return state.messageList;
    },
    get hasMoreOlderMessage() {
      return state.hasMoreOlderMessage;
    },
    get hasMoreNewerMessage() {
      return state.hasMoreNewerMessage;
    },
    get enableReadReceipt() {
      return state.enableReadReceipt;
    },
    get isDisableScroll() {
      return state.isDisableScroll;
    },
    get recalledMessageIDSet() {
      return state.recalledMessageIDSet;
    },
    get highlightMessageIDSet() {
      return state.highlightMessageIDSet;
    },

    loadMoreOlderMessage: TUIChatService.getMessageList,
    setEnableReadReceipt,
    setIsDisableScroll,
    highlightMessage,
  };
}

const initMessageListWatcher = () => {
  function onMessageListUpdated(_messageList: MessageModel[]) {
    if (!state.activeConversationID) {
      return;
    }
    function createOptimizedMessage(originalMessage: MessageModel): MessageModel {
      return {
        ...originalMessage,

        status: originalMessage.status,
        progress: originalMessage.progress,
        isRevoked: originalMessage.isRevoked,
        isDeleted: originalMessage.isDeleted,
        isPeerRead: originalMessage.isPeerRead,

        readReceiptInfo: originalMessage.readReceiptInfo
          ? {
            ...originalMessage.readReceiptInfo,
            readCount: originalMessage.readReceiptInfo.readCount,
            unreadCount: originalMessage.readReceiptInfo.unreadCount,
            isPeerRead: originalMessage.readReceiptInfo.isPeerRead,
          }
          : originalMessage.readReceiptInfo,

        getMessageContent: () => originalMessage.getMessageContent(),
        deleteMessage: () => originalMessage.deleteMessage(),
        revokeMessage: () => originalMessage.revokeMessage(),
        resendMessage: () => originalMessage.resendMessage(),
        getSignalingInfo: () => originalMessage.getSignalingInfo(),
        modifyMessage: options => originalMessage.modifyMessage(options),
        quoteMessage: () => originalMessage.quoteMessage(),
        replyMessage: () => originalMessage.replyMessage(),
      };
    }

    const optimizedMessageList = _messageList
      .map(createOptimizedMessage);

    state.messageList = optimizedMessageList;
    state.messageList.forEach((message) => {
      if (message.isRevoked) {
        state.recalledMessageIDSet.add(message.ID);
      }
    });
  }

  function onMessageListLoadStateUpdated(isCompleted: boolean) {
    state.hasMoreOlderMessage = !isCompleted;
  }

  function onActiveConversationIDUpdated(conversationID: string) {
    if (!conversationID || conversationID !== prevConversationID) {
      initialState();
      state.activeConversationID = conversationID;
    }
    prevConversationID = conversationID || undefined;
  }

  TUIStore.watch(StoreName.CONV, {
    currentConversationID: onActiveConversationIDUpdated,
  });

  TUIStore.watch(StoreName.CHAT, {
    messageList: onMessageListUpdated,
    isCompleted: onMessageListLoadStateUpdated,
  });
};

initMessageListWatcher();

export { useMessageListState };