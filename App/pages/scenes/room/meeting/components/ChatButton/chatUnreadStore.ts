import { reactive } from 'vue';
import { useMessageListState } from '@/uni_modules/tuikit-atomic-x/state';

const unreadStore = reactive<Record<string, number>>({});
const panelOpenStore = reactive<Record<string, boolean>>({});

interface SubscriptionRecord {
  mlState: any;
  unsubscribe: (() => void) | null;
}

const subscriptions = new Map<string, SubscriptionRecord>();

export function getUnreadCount(conversationID: string): number {
  if (conversationID.length === 0) return 0;
  return unreadStore[conversationID] ?? 0;
}


export function ensureChatUnreadSubscription(conversationID: string): void {
  if (conversationID.length === 0) return;

  if (unreadStore[conversationID] == null) unreadStore[conversationID] = 0;
  if (panelOpenStore[conversationID] == null) panelOpenStore[conversationID] = false;

  const mlState = useMessageListState({ conversationID });
  const existing = subscriptions.get(conversationID);
  if (existing != null && existing.mlState === mlState && existing.unsubscribe != null) return;
  if (existing?.unsubscribe != null) existing.unsubscribe();

  const unsubscribe = mlState.messageListOnEvent((event: any) => {
    if (event.eventType !== 'OnReceiveNewMessage') return;
    const message = event.data?.message;
    if (message == null || message.isSentBySelf) return;
    if (panelOpenStore[conversationID]) return;
    unreadStore[conversationID] = (unreadStore[conversationID] ?? 0) + 1;
  });

  subscriptions.set(conversationID, { mlState, unsubscribe });
}

export function setChatPanelOpen(conversationID: string, isOpen: boolean): void {
  if (conversationID.length === 0) return;
  panelOpenStore[conversationID] = isOpen;
  if (isOpen) unreadStore[conversationID] = 0;
}

export function disposeChatUnread(conversationID: string): void {
  if (conversationID.length === 0) return;
  const existing = subscriptions.get(conversationID);
  if (existing?.unsubscribe != null) existing.unsubscribe();
  subscriptions.delete(conversationID);
  delete unreadStore[conversationID];
  delete panelOpenStore[conversationID];
}
