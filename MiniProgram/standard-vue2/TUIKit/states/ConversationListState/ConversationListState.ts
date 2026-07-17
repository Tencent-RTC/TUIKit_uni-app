// @ts-nocheck
import Vue from 'vue';
import TUIChatEngine, {
  TUIStore,
  StoreName,
  TUIConversationService,
  TUIGroupService,
  IConversationModel as ConversationModel,
} from '../chat-uikit-engine-lite';
import type { SetConversationDraftParams, CreateGroupParams } from '../chat-uikit-engine-lite';

interface ConversationListState {
  conversationList: ConversationModel[] | undefined;
  activeConversation: ConversationModel | undefined;
  totalUnRead: number;
  netStatus: 
    | typeof TUIChatEngine.TYPES.NET_STATE_CONNECTED
    | typeof TUIChatEngine.TYPES.NET_STATE_CONNECTING
    | typeof TUIChatEngine.TYPES.NET_STATE_DISCONNECTED;
}

interface ConversationListAction {
  setActiveConversation: (conversationID: string) => void;
  setCurrentConversation: (conversation: ConversationModel | undefined) => void;
  createC2CConversation: (userID: string) => Promise<ConversationModel>;
  createGroupConversation: (options: CreateGroupParams) => Promise<ConversationModel>;
  pinConversation: (conversationID: string, isPin: boolean) => Promise<unknown>;
  deleteConversation: (conversationID: string) => Promise<unknown>;
  muteConversation: (conversationID: string, isMute: boolean) => Promise<unknown>;
  setConversationDraft: (options: SetConversationDraftParams) => Promise<unknown>;
  markConversationUnread: (conversationID: string, isUnread: boolean) => void;
  setConversationList: (conversationList: ConversationModel[]) => void;
  setTotalUnRead: (totalUnRead: number) => void;
  getConversation: (conversationID: string) => ConversationModel | undefined;
}

type UseConversationListStateReturn = Omit<
  ConversationListState & ConversationListAction,
  'setConversationList' | 'setTotalUnRead' | 'getConversation' | 'setCurrentConversation'
>;

// 使用 Vue.observable 创建响应式状态
const state = Vue.observable({
  conversationList: undefined as ConversationModel[] | undefined,
  activeConversation: undefined as ConversationModel | undefined,
  totalUnRead: 0,
  netStatus: TUIChatEngine.TYPES.NET_STATE_CONNECTED as 
    | typeof TUIChatEngine.TYPES.NET_STATE_CONNECTED
    | typeof TUIChatEngine.TYPES.NET_STATE_CONNECTING
    | typeof TUIChatEngine.TYPES.NET_STATE_DISCONNECTED,
});

const setConversationList = (conversationList: ConversationModel[]) => {
  let totalUnread = 0;
  conversationList.forEach(conversation => {
    totalUnread += conversation.unreadCount || 0;
  });
  
  state.conversationList = conversationList;
  setTotalUnRead(totalUnread);
};

const setTotalUnRead = (totalUnRead: number) => {
  state.totalUnRead = totalUnRead;
};

const setCurrentConversation = (conversation: ConversationModel | undefined) => {
  state.activeConversation = conversation;
};

const getConversation = (conversationID: string) => {
  return state.conversationList?.find(item => item.conversationID === conversationID);
};

const markConversationUnread = (conversationID: string, isUnread: boolean) => {
  const conversation = getConversation(conversationID);
  const { markList = [], unreadCount = 0 } = conversation || {};
  const isMarked = markList.includes(TUIChatEngine.TYPES.CONV_MARK_TYPE_UNREAD);
  const isHasUnreadCount = unreadCount > 0;
  const isNotNeedMarkUnread = isUnread && (isHasUnreadCount || isMarked);
  const isNotNeedMarkRead = !isUnread && !isHasUnreadCount && !isMarked;

  if (!conversation || isNotNeedMarkUnread || isNotNeedMarkRead) {
    return Promise.resolve();
  }

  if (isHasUnreadCount && !isUnread) {
    return conversation?.setMessageRead();
  }
  return TUIConversationService.markConversation({
    conversationIDList: [conversationID],
    markType: TUIChatEngine.TYPES.CONV_MARK_TYPE_UNREAD,
    enableMark: isUnread,
  });
};

const setActiveConversation = async (conversationID: string) => {
  const currentActiveConversation = state.activeConversation;
  if (conversationID !== currentActiveConversation?.conversationID) {
    if (conversationID) {
      markConversationUnread(conversationID, false);
    }
    await TUIConversationService.switchConversation(conversationID);
  }
};

const pinConversation = (conversationID: string, isPin: boolean) => {
  const conversation = getConversation(conversationID);
  if (!conversation || conversation?.isPinned === isPin) {
    return Promise.resolve();
  }
  return conversation?.pinConversation();
};

const deleteConversation = (conversationID: string) => {
  const conversation = getConversation(conversationID);
  if (!conversation) {
    return Promise.resolve();
  }
  return conversation?.deleteConversation();
};

const muteConversation = (conversationID: string, isMuted: boolean) => {
  const conversation = getConversation(conversationID);
  if (!conversation || conversation?.isMuted === isMuted) {
    return Promise.resolve();
  }
  return conversation?.muteConversation();
};

const setConversationDraft = (options: SetConversationDraftParams) => TUIConversationService.setConversationDraft(options);

const createC2CConversation = async (userID: string) => {
  const response = await TUIConversationService.getConversationProfile(`C2C${userID}`);
  return response.data.conversation;
};

const createGroupConversation = async (options: CreateGroupParams) => {
  const { groupID, ...otherOptions } = options;
  const params: CreateGroupParams = otherOptions;
  if (options.type !== TUIChatEngine.TYPES.GRP_COMMUNITY) {
    params.groupID = groupID || '';
  }
  const res = await TUIGroupService.createGroup(params);
  const { type } = res.data.group;

  if (type === TUIChatEngine.TYPES.GRP_AVCHATROOM) {
    await TUIGroupService.joinGroup({
      groupID: res.data.group.groupID,
      applyMessage: '',
    });
  }
  const response = await TUIConversationService.getConversationProfile(`GROUP${res.data.group.groupID}`);
  const conversation = response.data.conversation;
  
  return conversation;
};

function initConversationWatcher() {
  TUIStore.watch(StoreName.CONV, {
    conversationList: (list: ConversationModel[]) => {
      setConversationList(list);
    },
    currentConversation: (conversation: ConversationModel | null) => {
      setCurrentConversation(conversation ?? undefined);
    },
  });
}

initConversationWatcher();

function useConversationListState(): UseConversationListStateReturn {
  return {
    get conversationList() {
      return state.conversationList;
    },
    get activeConversation() {
      return state.activeConversation;
    },
    get totalUnRead() {
      return state.totalUnRead;
    },
    get netStatus() {
      return state.netStatus;
    },
    setActiveConversation,
    markConversationUnread,
    pinConversation,
    deleteConversation,
    muteConversation,
    setConversationDraft,
    createC2CConversation,
    createGroupConversation,
  };
}

export { useConversationListState };
export default useConversationListState;