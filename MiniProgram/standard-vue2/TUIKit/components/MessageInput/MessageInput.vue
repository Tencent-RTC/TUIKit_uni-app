<template>
  <!-- 消息输入容器-->
  <div class="message-input-container" :style="{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 'px' : '' }">
    <!-- 正常状态：可以发送消息 -->
    <view class="input-container" v-if="canSendMessage">
      <!-- 消息输入框 -->
      <input class="message-input" type="text" :value="inputRawValue" confirm-type="send" @confirm="sendInputMessage"
        @input="updateRawValue" :adjust-position="false"
        :style="{ borderColor: inputRawValue ? '#006eff' : 'transparent' }" />

      <!-- 更多功能按钮（当输入框为空时显示） -->
      <view class="icon-btn" v-if="!inputRawValue" @click="toggleMorePanel">
        <image :src="MorePanelIcon"></image>
      </view>

      <!-- 发送按钮（当输入框有内容时显示） -->
      <view class="send-btn" v-if="inputRawValue" @click="sendInputMessage">
        <text>发送</text>
      </view>
    </view>

    <!-- 退出群聊状态：显示提示信息 -->
    <view class="input-container disabled-container" v-else>
      <view class="disabled-message">
        <text class="disabled-text">你已退出群聊，无法发送消息</text>
      </view>
    </view>

    <!-- 更多功能面板 -->
    <view class="more-panel" v-if="showMorePanel" @touchmove.stop.prevent>
      <view class="panel-content">
        <ImagePicker @closePanel="closePanel" />
        <PhotoPicker @closePanel="closePanel" />
        <VideoCallPicker @closePanel="closePanel" @showUserPicker="handleShowUserPicker" />
        <VoiceCallPicker @closePanel="closePanel" @showUserPicker="handleShowUserPicker" />
      </view>
    </view>

    <!-- 用户选择器弹窗 -->
    <view v-if="showUserPicker" class="user-picker-modal">
      <view class="modal-mask" @click="closeUserPicker"></view>
      <view class="modal-content">
        <view class="modal-header">
          <text class="modal-title">选择通话用户</text>
          <view class="close-btn" @click="closeUserPicker">×</view>
        </view>
        <UserPicker style="height: 100%;" :maxCount="1" :dataSource="filteredGroupMembers" :enableDelete="false" :inModal="true"
          @confirm="handleUserSelect" />
      </view>
    </view>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { useMessageInputState } from '../../states/MessageInputState';
import { useConversationListState } from '../../states/ConversationListState';
import { useGroupSettingState } from '../../states/GroupSettingState';
import VideoCallPicker from './AttachmentPicker/VideoCallPicker.vue';
import VoiceCallPicker from './AttachmentPicker/VoiceCallPicker.vue';
import ImagePicker from './AttachmentPicker/CameraPicker.vue';
import PhotoPicker from './AttachmentPicker/PhotoPicker.vue';
import UserPicker from '../UserPicker/UserPicker.vue';
import MorePanelIcon from '../../assets/chat/more-panel.svg';
import { TUIBridge } from '../../TUIBridge';
import { EVENT } from '../../constants/event';
import { MessageContentType } from '../../constants/chat';
import { isCallIntegrated } from '../../utils/callIntegration';
const { sendMessage } = useMessageInputState();
const { activeConversation } = useConversationListState();
const { getGroupMemberList } = useGroupSettingState();

export default {
  options: {
    virtualHost: true,
  },
  components: {
    VideoCallPicker,
    VoiceCallPicker,
    ImagePicker,
    PhotoPicker,
    UserPicker
  },
  data() {
    return {
      MorePanelIcon: MorePanelIcon,
      inputRawValue: '',
      showMorePanel: false,
      showUserPicker: false,
      currentCallType: 1,
      keyboardHeight: 0,
    }
  },
  computed: {
    activeConversation() {
      const { activeConversation } = useConversationListState();
      return activeConversation;
    },
    allMembers() {
      const { allMembers } = useGroupSettingState();
      return allMembers;
    },
    isInGroup() {
      const { isInGroup } = useGroupSettingState();
      return isInGroup;
    },
    currentUserID() {
      const { currentUserID } = useGroupSettingState();
      return currentUserID;
    },
    // 判断是否可以发送消息
    canSendMessage() {
      // 如果不是群聊，可以发送消息
      if (this.activeConversation?.type !== 'GROUP') {
        return true;
      }

      // 如果是群聊，检查是否在群里
      // 当解散群聊或被踢出群时，isInGroup会是false或undefined
      return this.isInGroup === true;
    },
    // 过滤掉自己的群成员列表
    filteredGroupMembers() {
      return (this.allMembers || []).filter(member => member.userID !== this.currentUserID);
    }
  },
  mounted() {
    this.loadGroupMembers();
    // Listen for keyboard height changes
    uni.onKeyboardHeightChange((res) => {
      this.keyboardHeight = res.height;
      if (res.height > 0) {
        // Close more panel when keyboard pops up
        this.showMorePanel = false;
        uni.$emit('TUIChat:keyboardHeightChange', res.height);
      }
    });
  },
  beforeDestroy() {
    uni.offKeyboardHeightChange();
  },
  watch: {
    isInGroup() {
      // 只有在群里才加载群成员
      if (this.isInGroup) {
        this.loadGroupMembers();
      }
    }
  },
  methods: {
    async loadGroupMembers() {
      // 只有在群里且是群聊时才加载群成员
      if (this.activeConversation?.type === 'GROUP' && this.isInGroup) {
        await getGroupMemberList({ count: 100 });
      }
    },
    toggleMorePanel() {
      this.showMorePanel = !this.showMorePanel;
    },
    closePanel() {
      this.showMorePanel = false;
    },
    updateRawValue(e) {
      // 处理输入事件，兼容不同的事件对象格式
      const value = e.detail ? e.detail.value : e.target.value;
      this.inputRawValue = value;
    },
    sendInputMessage() {
      if (!this.inputRawValue) return;

       sendMessage({
          type: MessageContentType.TEXT,
          content: this.inputRawValue
        });

      this.inputRawValue = '';
    },
    handleShowUserPicker({ type }) {
      this.currentCallType = type;
      this.showUserPicker = true;
    },
    handleUserSelect(selectedUserIDs) {
      if (selectedUserIDs.length > 0) {

    if (!isCallIntegrated()) {
      uni.showToast({ title: '通话功能未集成', icon: 'none' });
      this.closeUserPicker();
      return;
    }
        TUIBridge.notifyEvent({
          eventName: EVENT.ON_CALLS,
          params: {
            userIDList: selectedUserIDs,
            type: this.currentCallType,
            //  groupID: this.activeConversation.groupID,
          },
        });
      }
      this.closeUserPicker();
    },
    closeUserPicker() {
      this.showUserPicker = false;
    }
  }
}
</script>

<style lang="scss" scoped>
.message-input-container {
  position: relative;
  /* iOS安全区域适配 - 稍微增加间距 */
  padding-bottom: calc(constant(safe-area-inset-bottom) * 0.4);
  padding-bottom: calc(env(safe-area-inset-bottom) * 0.4);
  /* 添加背景色覆盖安全区域 */
  background-color: #FFFFFF;
}

.input-container {
  width: 100%;
  height: 48px;
  background-color: #FFFFFF;
  border-top: 1px solid #e5e5e5;
  display: flex;
  align-items: center;
  z-index: 100;
  /* 移除额外间距，只保留外层容器的安全区域适配 */
  padding-bottom: 0;
}

.disabled-container {
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  /* iOS安全区域适配 - 稍微增加间距 */
  padding-bottom: calc(constant(safe-area-inset-bottom) * 0.55);
  padding-bottom: calc(env(safe-area-inset-bottom) * 0.55);
}

.disabled-message {
  padding: 12px 16px;
  text-align: center;
}

.disabled-text {
  font-size: 14px;
  color: #999;
  line-height: 1.4;
}

.icon-btn {
  width: 28px;
  height: 28px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  image {
    width: 100%;
    height: 100%;
  }
}

.message-input {
  flex: 1;
  height: 36px;
  padding: 0 15px;
  background-color: #F0F2F7;
  border-radius: 4px;
  font-size: 16px;
  border: 1px solid transparent;
  margin: 0 10px;
}

.send-btn {
  min-width: 60px;
  height: 36px;
  padding: 0 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #006eff;
  color: #fff;
  border-radius: 4px;
  font-size: 14px;
  margin: 0 5px;
}

.more-panel {
  width: 100%;
  height: 125px;
  background-color: #fff;
  z-index: 99;
  /* iOS安全区域适配 - 稍微增加间距 */
  padding-bottom: calc(constant(safe-area-inset-bottom) * 0.55);
  padding-bottom: calc(env(safe-area-inset-bottom) * 0.55);
}

.panel-content {
  height: 100%;
  padding: 10px 0;
  display: flex;
  flex-wrap: wrap;
  border-top: 1px solid #eee;
  justify-content: center;
  padding: 10px;
}

.user-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 95%;
  max-width: 500px;
  height: 90vh;
  max-height: 800px;
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
  background-color: #fff;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f5f5f5;
}
</style>