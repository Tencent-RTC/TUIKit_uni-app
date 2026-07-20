import { ref } from 'vue';
import type { Ref } from 'vue';
import TUIChatEngine, {
  TUIStore,
  StoreName,
  TUIConversationService,
  TUIGroupService,
  IConversationModel as ConversationModel,
} from '../chat-uikit-engine-lite';
import type { CreateGroupParams } from './types';

interface ConversationListState {
  conversationList: Ref<ConversationModel[] | undefined>;
  activeConversation: Ref<ConversationModel | undefined>;
  totalUnRead: Ref<number>;
  netStatus: Ref<
    | typeof TUIChatEngine.TYPES.NET_STATE_CONNECTED
    | typeof TUIChatEngine.TYPES.NET_STATE_CONNECTING
    | typeof TUIChatEngine.TYPES.NET_STATE_DISCONNECTED
  >;
}

interface ConversationListAction {
  setActiveConversation: (conversationID: string) => void;
  setCurrentConversation: (conversation: ConversationModel | undefined) => void;
  createC2CConversation: (userID: string) => Promise<ConversationModel>;
  createGroupConversation: (options: CreateGroupParams) => Promise<ConversationModel>;
  setConversationList: (conversationList: ConversationModel[]) => void;
  setTotalUnRead: (totalUnRead: number) => void;
}

type UseConversationListStateReturn = Omit<
  ConversationListState & ConversationListAction,
  'setConversationList' | 'setTotalUnRead' | 'getConversation' | 'setCurrentConversation'
>;

const conversationListRef = ref<ConversationModel[] | undefined>(undefined);
const activeConversationRef = ref<ConversationModel | undefined>(undefined);
const totalUnReadRef = ref<number>(0);

const setConversationList = (conversationList: ConversationModel[]) => {
  let totalUnread = 0;
  conversationList.forEach(conversation => {
    totalUnread += conversation.unreadCount || 0;
  });
  conversationListRef.value = conversationList;
  setTotalUnRead(totalUnread);
};

const setTotalUnRead = (totalUnRead: number) => {
  totalUnReadRef.value = totalUnRead;
};

const setCurrentConversation = (conversation: ConversationModel | undefined) => {
  activeConversationRef.value = conversation;
};

const setActiveConversation = async (conversationID: string) => {
  const currentActiveConversation = activeConversationRef.value;
  if (conversationID !== currentActiveConversation?.conversationID) {
    await TUIConversationService.switchConversation(conversationID);
  }
};

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
    conversationList: conversationListRef,
    activeConversation: activeConversationRef,
    totalUnRead: totalUnReadRef,
    setActiveConversation,
    createC2CConversation,
    createGroupConversation
  };
}

export { useConversationListState };
export default useConversationListState;
