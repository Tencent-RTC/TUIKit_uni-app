import type { IEventCenter, ITUIChatEngine } from '../interface/engine';
import type { func } from '../type';

export default class EventCenter implements IEventCenter {
  static instance: EventCenter | null;
  private engine!: ITUIChatEngine;
  private events: any;

  constructor(ChatEngine: any) {
    if (!EventCenter.instance) {
      EventCenter.instance = this;
      this.engine = ChatEngine;
      this.events = {};
      this.bindIMEvents();
    }
    return EventCenter.instance;
  }

  public addEvent(event: string, callback: func) {
    if (this.events[event]) {
      this.events[event].set(callback, 1);
    } else {
      this.events[event] = new Map();
      this.events[event].set(callback, 1);
    }
  }

  public removeEvents() {
    Object.keys(this.events).forEach((event) => {
      this.events[event].clear();
    });
    this.events = {};
  }

  private dispatch(event: string, data: any) {
    if (!this.events[event]) {
      return;
    }
    for (const callback of this.events[event].keys()) {
      callback.call(this, data);
    }
  }

  private bindIMEvents() {
    this.engine.chat.on(this.engine.EVENT.SDK_READY, this.onSDKReady, this);
    this.engine.chat.on(this.engine.EVENT.SDK_NOT_READY, this.onSDKNotReady, this);
    this.engine.chat.on(this.engine.EVENT.KICKED_OUT, this.onKickedOut, this);
    this.engine.chat.on(this.engine.EVENT.MESSAGE_RECEIVED, this.onReceiveMessage, this);
    this.engine.chat.on(this.engine.EVENT.MESSAGE_REACTIONS_UPDATED, this.onMessageReactionsUpdated, this);
    this.engine.chat.on(this.engine.EVENT.CONVERSATION_LIST_UPDATED, this.onConversationListUpdated, this);
    this.engine.chat.on(this.engine.EVENT.TOTAL_UNREAD_MESSAGE_COUNT_UPDATED, this.onTotalMessageCountUpdated, this);
    this.engine.chat.on(this.engine.EVENT.PROFILE_UPDATED, this.onProfileUpdated, this);
    this.engine.chat.on(this.engine.EVENT.GROUP_LIST_UPDATED, this.onGroupListUpdated, this);
    this.engine.chat.on(this.engine.EVENT.GROUP_ATTRIBUTES_UPDATED, this.onGroupAttributesUpdated, this);
    this.engine.chat.on(this.engine.EVENT.GROUP_COUNTER_UPDATED, this.onGroupCounterUpdated, this);
    this.engine.chat.on(this.engine.EVENT.MESSAGE_MODIFIED, this.onMessageModified, this);
  }

  public unbindIMEvents() {
    this.engine.chat.off(this.engine.EVENT.SDK_READY, this.onSDKReady, this);
    this.engine.chat.off(this.engine.EVENT.SDK_NOT_READY, this.onSDKNotReady, this);
    this.engine.chat.off(this.engine.EVENT.KICKED_OUT, this.onKickedOut, this);
    this.engine.chat.off(this.engine.EVENT.MESSAGE_RECEIVED, this.onReceiveMessage, this);
    this.engine.chat.off(this.engine.EVENT.MESSAGE_REACTIONS_UPDATED, this.onMessageReactionsUpdated, this);
    this.engine.chat.off(this.engine.EVENT.CONVERSATION_LIST_UPDATED, this.onConversationListUpdated, this);
    this.engine.chat.off(this.engine.EVENT.TOTAL_UNREAD_MESSAGE_COUNT_UPDATED, this.onTotalMessageCountUpdated, this);
    this.engine.chat.off(this.engine.EVENT.PROFILE_UPDATED, this.onProfileUpdated, this);
    this.engine.chat.off(this.engine.EVENT.GROUP_LIST_UPDATED, this.onGroupListUpdated, this);
    this.engine.chat.off(this.engine.EVENT.GROUP_ATTRIBUTES_UPDATED, this.onGroupAttributesUpdated, this);
    this.engine.chat.off(this.engine.EVENT.GROUP_COUNTER_UPDATED, this.onGroupCounterUpdated, this);
    this.engine.chat.off(this.engine.EVENT.MESSAGE_MODIFIED, this.onMessageModified, this);
    EventCenter.instance = null;
  }

  private onMessageModified(event: any) {
    this.dispatch(this.engine.EVENT.MESSAGE_MODIFIED, event.data);
  }

  private onSDKReady(event: any) {
    this.dispatch(this.engine.EVENT.SDK_READY, event.data);
  }

  private onSDKNotReady(event: any) {
    this.dispatch(this.engine.EVENT.SDK_NOT_READY, event.data);
  }

  private onKickedOut(event: any) {
    this.dispatch(this.engine.EVENT.KICKED_OUT, event.data);
  }

  private onReceiveMessage(event: any) {
    this.dispatch(this.engine.EVENT.MESSAGE_RECEIVED, event.data);
  }

  private onMessageReactionsUpdated(event: any) {
    this.dispatch(this.engine.EVENT.MESSAGE_REACTIONS_UPDATED, event.data);
  }

  private onConversationListUpdated(event: any) {
    this.dispatch(this.engine.EVENT.CONVERSATION_LIST_UPDATED, event.data);
  }

  private onTotalMessageCountUpdated(event: any) {
    this.dispatch(this.engine.EVENT.TOTAL_UNREAD_MESSAGE_COUNT_UPDATED, event.data);
  }

  private onProfileUpdated(event: any) {
    this.dispatch(this.engine.EVENT.PROFILE_UPDATED, event.data);
  }

  private onGroupListUpdated(event: any) {
    this.dispatch(this.engine.EVENT.GROUP_LIST_UPDATED, event.data);
  }

  private onGroupAttributesUpdated(event: any) {
    this.dispatch(this.engine.EVENT.GROUP_ATTRIBUTES_UPDATED, event.data);
  }

  private onGroupCounterUpdated(event: any) {
    this.dispatch(this.engine.EVENT.GROUP_COUNTER_UPDATED, event.data);
  }
}
