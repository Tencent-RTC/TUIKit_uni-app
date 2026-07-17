<template>
  <view class="container">
    <view class="action-buttons">
      <view class="action-button" @click="openConversationList">
        <text class="button-text">会话列表</text>
      </view>
      <view class="action-button" @click="openContact">
        <text class="button-text">联系人</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
const openConversationList = () => {
  uni.navigateTo({
    url: '/TUIKit/components/TUIConversation/index'
  });
};

const openContact = () => {
  uni.navigateTo({
    url: '/TUIKit/components/TUIContact/index'
  });
};
</script>

<style scoped>
.container {
  padding: 40px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  padding: 6px;
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 48px;
  background: linear-gradient(135deg, #4086FF 0%, #2E5CFF 100%);
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(64, 134, 255, 0.25), 0 2px 6px rgba(64, 134, 255, 0.15);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.action-button:active {
  transform: translateY(1px);
  box-shadow: 0 4px 15px rgba(64, 134, 255, 0.2), 0 1px 4px rgba(64, 134, 255, 0.1);
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  border-radius: 12px 12px 0 0;
}

.button-text {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  text-align: center;
}
</style>
