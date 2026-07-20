import type { Ref } from 'vue';
import { ref } from 'vue';
import {
  TUIStore,
  StoreName,
  TUIChatService,
} from '../chat-uikit-engine-lite';
import type { IMessageModel as MessageModel } from '../chat-uikit-engine-lite';

interface MessageListState {
  activeConversationID: Ref<string | undefined>;
  messageList: Ref<readonly MessageModel[] | undefined>;
  hasMoreOlderMessage: Ref<boolean | undefined>;
  hasMoreNewerMessage: Ref<boolean | undefined>;
  enableReadReceipt: Ref<boolean | undefined>;
  isDisableScroll: Ref<boolean | undefined>;
  recalledMessageIDSet: Ref<Set<string>>;
  highlightMessageIDSet: Ref<Set<string>>;
}

interface MessageListBusinessAction {
  loadMoreOlderMessage: () => Promise<void>;
  // TODO
  // loadMoreNewerMessage: () => Promise<void>;
  setEnableReadReceipt: (enableReadReceipt: boolean | undefined) => void;
  setIsDisableScroll: (isDisableScroll: boolean) => void;
  highlightMessage: ({ messageID, duration }: { messageID: string; duration: number }) => void;
}

// internal state
let prevConversationID: string | undefined;

// initial state
const activeConversationID = ref<string | undefined>(undefined);
const messageList = ref<readonly MessageModel[] | undefined>(undefined);
const hasMoreOlderMessage = ref<boolean | undefined>(undefined);
const hasMoreNewerMessage = ref<boolean | undefined>(undefined);
const enableReadReceipt = ref<boolean | undefined>(undefined);
const isDisableScroll = ref<boolean | undefined>(undefined);
const recalledMessageIDSet = ref<Set<string>>(new Set());
const highlightMessageIDSet = ref<Set<string>>(new Set());

function initialState() {
  activeConversationID.value = undefined;
  messageList.value = undefined;
  hasMoreOlderMessage.value = undefined;
  hasMoreNewerMessage.value = undefined;
  enableReadReceipt.value = undefined;
  isDisableScroll.value = undefined;
  recalledMessageIDSet.value = new Set();
  highlightMessageIDSet.value = new Set();
}

// business actions
function setEnableReadReceipt(_enableReadReceipt: boolean | undefined): void {
  enableReadReceipt.value = _enableReadReceipt;
}

function setIsDisableScroll(_isDisableScroll: boolean): void {
  isDisableScroll.value = _isDisableScroll;
}

function highlightMessage({ messageID, duration }: { messageID: string; duration: number }): void {
  highlightMessageIDSet.value.add(messageID);
  setTimeout(() => {
    highlightMessageIDSet.value.delete(messageID);
  }, duration);
}

function useMessageListState(): MessageListState & MessageListBusinessAction {
  return {
    // state
    activeConversationID,
    messageList,
    hasMoreOlderMessage,
    hasMoreNewerMessage,
    enableReadReceipt,
    isDisableScroll,
    recalledMessageIDSet,
    highlightMessageIDSet,
    // actions
    loadMoreOlderMessage: TUIChatService.getMessageList,
    // TODO
    // loadMoreNewerMessage: TUIChatService.getMessageList,
    setEnableReadReceipt,
    setIsDisableScroll,
    highlightMessage,
  };
}

const initMessageListWatcher = () => {
  /** watcher binding */
  function onMessageListUpdated(_messageList: MessageModel[]) {
    if (!activeConversationID.value) {
      return;
    }
    function createOptimizedMessage(originalMessage: MessageModel): MessageModel {
      // use spread operator to copy all own properties, but will lose the prototype chain methods
      return {
        ...originalMessage,

        // 🎯 re-create frequently changing properties to ensure React can detect changes
        status: originalMessage.status,
        progress: originalMessage.progress,
        isRevoked: originalMessage.isRevoked,
        isDeleted: originalMessage.isDeleted,
        isPeerRead: originalMessage.isPeerRead,

        // 🎯 re-create read receipt info object
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

    messageList.value = optimizedMessageList;
    // resolve recalled message ID for quoted message
    messageList.value.forEach((message) => {
      if (message.isRevoked) {
        recalledMessageIDSet.value.add(message.ID);
      }
    });
  }

  function onMessageListLoadStateUpdated(isCompleted: boolean) {
    hasMoreOlderMessage.value = !isCompleted;
  }

  function onActiveConversationIDUpdated(conversationID: string) {
    if (!conversationID || conversationID !== prevConversationID) {
      initialState();
      activeConversationID.value = conversationID;
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
