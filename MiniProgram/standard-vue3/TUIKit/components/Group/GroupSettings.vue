<template>
  <view class="group-settings">
    <!-- 顶部群信息 -->
    <view class="group-header">
      <view class="group-avatar">
        <Avatar :avatarStyle="groupAvatarStyle" :src="avatar || defaultGroupAvatarIcon"></Avatar>
      </view>
      <view class="group-basic-info">
        <div class="group-name">{{ groupName || '群聊' }}</div>
        <div class="group-id">群ID: {{ groupID || '--' }}</div>
      </view>
      <view class="edit-name-btn" @click.stop="editGroupName" v-if="currentUserRole === GroupMemberRole.OWNER">
        <text class="edit-icon">›</text>
      </view>
    </view>

    <!-- 设置项列表 -->
    <view class="settings-list">


      <!-- 群成员 -->
      <view class="setting-item member-section">
        <view class="item-left">
          <text class="item-label">群成员</text>
        </view>
        <view class="item-right">
          <text class="member-count">{{ memberCount || 0 }}人</text>
        </view>
      </view>
      <GroupMembers @addMembers="onAddMembers" @removeMembers="onRemoveMembers" />

      <!-- 群公告 -->
      <view class="setting-item" @click="showGroupNotice">
        <view class="item-left">
          <text class="item-label">群公告</text>
        </view>
        <view class="item-right">
          <text class="item-value notice-preview">{{ noticePreview }}</text>
          <text class="item-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 群类型 -->
    <view class="setting-item group-type-item" @click="showGroupType">
      <view class="item-left">
        <text class="item-label">群类型</text>
      </view>
      <view class="item-right">
        <text class="item-value">{{ groupTypeText }}</text>
      </view>
    </view>

    <!-- 退出群聊/解散群组按钮 -->
    <view class="exit-section">
      <div class="exit-btn" @click="confirmExit">
        {{ currentUserRole === GroupMemberRole.OWNER ? '解散群组' : '退出群聊' }}
      </div>
    </view>

    <!-- 编辑群名称弹窗 -->
    <view v-if="showEditGroupName" class="modal-overlay" @click="showEditGroupName = false">
      <view class="edit-modal" @click.stop>
        <view class="modal-content">
          <text class="modal-title">编辑群名称</text>
          <input v-model="editGroupNameValue" class="edit-input" maxlength="30" />
          <view class="modal-buttons">
            <button class="btn-cancel" @click="showEditGroupName = false">取消</button>
            <button class="btn-confirm" @click="saveGroupName">保存</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 编辑群公告弹窗 -->
    <view v-if="showEditGroupNotice" class="modal-overlay" @click="showEditGroupNotice = false">
      <view class="edit-modal" @click.stop>
        <view class="modal-content">
          <text class="modal-title">{{ currentUserRole === GroupMemberRole.OWNER ? '编辑群公告' : '群公告' }}</text>
          <textarea v-if="currentUserRole === GroupMemberRole.OWNER" v-model="editGroupNoticeValue"
            class="edit-textarea" maxlength="130" />
          <view v-else class="notice-content">
            <text>{{ notification || '暂无公告' }}</text>
          </view>
          <view class="modal-buttons">
            <button class="btn-cancel" @click="showEditGroupNotice = false">取消</button>
            <button v-if="currentUserRole === GroupMemberRole.OWNER" class="btn-confirm"
              @click="saveGroupNotice">保存</button>
          </view>
        </view>
      </view>
    </view>



    <!-- 确认退出弹窗 -->
    <view v-if="showExitConfirm" class="modal-overlay" @click="showExitConfirm = false">
      <view class="confirm-modal" @click.stop>
        <view class="modal-content">
          <text class="modal-title">{{ currentUserRole === GroupMemberRole.OWNER ? '解散群组' : '退出群聊' }}</text>
          <text class="modal-desc">
            {{ currentUserRole === GroupMemberRole.OWNER ? '解散后群组将被永久删除，所有成员将被移除' : '退出后将不再接收此群聊的消息' }}
          </text>
          <view class="modal-buttons">
            <button class="btn-cancel" @click="showExitConfirm = false">取消</button>
            <button class="btn-confirm danger" @click="handleQuitGroup">
              {{ currentUserRole === GroupMemberRole.OWNER ? '解散' : '退出' }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { GroupType, GroupInviteType, GroupMemberRole } from '../../states/GroupSettingState/types';
import { useGroupSettingState } from '../../states/GroupSettingState/GroupSettingState';
import Avatar from '../Avatar/Avatar.vue';
import GroupMembers from './GroupMembers.vue';
import defaultGroupAvatarIcon from '../../assets/base/default-group-avatar.png';

const {
  // 状态数据
  groupID,
  groupType,
  groupName,
  avatar,
  notification,
  memberCount,
  allMembers,
  currentUserID,
  currentUserRole,
  inviteOption,

  // 业务方法
  quitGroup,
  dismissGroup,
  getGroupMemberList,
  updateGroupProfile,
  addGroupMember,
  deleteGroupMember
} = useGroupSettingState();

// 弹窗状态
const showExitConfirm = ref(false);
const showEditGroupName = ref(false);
const showEditGroupNotice = ref(false);

// 编辑值
const editGroupNameValue = ref('');
const editGroupNoticeValue = ref('');

const groupAvatarStyle = {
  width: '100%',
  height: '100%'
}



// 群公告预览
const noticePreview = computed(() => {
  const notice = notification.value || '暂无公告';
  return notice.length > 15 ? notice.substring(0, 15) + '...' : notice;
});

// 群类型文本
const groupTypeText = computed(() => {
  const types = {
    [GroupType.PUBLIC]: '公开群',
    [GroupType.MEETING]: '会议群',
    [GroupType.WORK]: '工作群'
  };
  return types[groupType.value as GroupType] || '普通群';
});

// 加群方式文本
const joinMethodText = computed(() => {
  const methods = {
    [GroupInviteType.FREE_ACCESS]: '自由加入',
    [GroupInviteType.NEED_PERMISSION]: '需要验证',
    [GroupInviteType.DISABLE_APPLY]: '禁止加入'
  };
  return methods[inviteOption.value as GroupInviteType] || '未知方式';
});



// 方法定义
const editGroupName = () => {
  console.log('editGroupName 被调用，currentUserRole:', currentUserRole.value);
  if (currentUserRole.value !== GroupMemberRole.OWNER) {
    uni.showToast({
      title: '只有群主可以修改群名称',
      icon: 'none'
    });
    return;
  }
  editGroupNameValue.value = '';
  showEditGroupName.value = true;
};

const onAddMembers = async (userIDs: string[]) => {
  try {
    await addGroupMember({ userIDList: userIDs });
  } catch (error) {
    console.error('添加群成员失败:', error);
    throw error;
  }
};

const onRemoveMembers = async (userIDs: string[]) => {
  try {
    await deleteGroupMember({ userIDList: userIDs });
  } catch (error) {
    console.error('删除群成员失败:', error);
    throw error;
  }
};

const showGroupNotice = () => {
  if (currentUserRole.value === GroupMemberRole.OWNER) {
    editGroupNoticeValue.value = notification.value || '';
  }
  showEditGroupNotice.value = true;
};

// 保存方法
const saveGroupName = async () => {
  if (!editGroupNameValue.value.trim()) {
    uni.showToast({
      title: '群名称不能为空',
      icon: 'none'
    });
    return;
  }

  try {
    await updateGroupProfile({
      name: editGroupNameValue.value.trim()
    });
    uni.showToast({
      title: '群名称修改成功',
      icon: 'success'
    });
    showEditGroupName.value = false;
  } catch (error) {
    console.error('修改群名称失败:', error);
    uni.showToast({
      title: '修改群名称失败',
      icon: 'none'
    });
  }
};

const saveGroupNotice = async () => {
  try {
    await updateGroupProfile({
      notification: editGroupNoticeValue.value.trim()
    });
    uni.showToast({
      title: '群公告修改成功',
      icon: 'success'
    });
    showEditGroupNotice.value = false;
  } catch (error) {
    console.error('修改群公告失败:', error);
    uni.showToast({
      title: '修改群公告失败',
      icon: 'none'
    });
  }
};



const confirmExit = () => {
  showExitConfirm.value = true;
};

const handleQuitGroup = async () => {
  try {
    if (currentUserRole.value === GroupMemberRole.OWNER) {
      // 群主调用解散群组
      await dismissGroup();
    } else {
      // 群成员调用退出群组
      await quitGroup();
    }
    uni.showToast({
      title: currentUserRole.value === GroupMemberRole.OWNER ? '解散群组成功' : '退出群聊成功',
      icon: 'success'
    });
    // 返回上一页
    uni.navigateBack();
  } catch (error) {
    console.error(currentUserRole.value === GroupMemberRole.OWNER ? '解散群组失败:' : '退出群聊失败:', error);
    uni.showToast({
      title: currentUserRole.value === GroupMemberRole.OWNER ? '解散群组失败' : '退出群聊失败',
      icon: 'none'
    });
  } finally {
    showExitConfirm.value = false;
  }
};
</script>

<style lang="scss" scoped>
.group-settings {
  background: #F9FAFC;
  min-height: 100vh;
  padding: 0;
}

/* 群信息头部 */
.group-header {
  background: #FFFFFF;
  padding: 40rpx 30rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #e5e5e5;
  position: relative;
}

.group-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  overflow: hidden;
  margin-right: 30rpx;
  background: white;
  border: 1rpx solid #e5e5e5;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);
}

.group-basic-info {
  flex: 1;
}

.group-basic-info .group-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #000;
  margin-bottom: 12rpx;
  line-height: 1.2;
}

.group-basic-info .group-id {
  font-size: 26rpx;
  color: #999;
  font-weight: 400;
}

.edit-name-btn {
  position: absolute;
  top: 40rpx;
  right: 30rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.edit-name-btn:active {
  background-color: #e9ecef;
  transform: scale(0.95);
}

.edit-icon {
  font-size: 28rpx;
}

/* 设置项列表 */
.settings-list {
  background: white;
  margin-bottom: 20rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  margin-top: 16rpx;
  /* 8px 间距 */
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: white;
  position: relative;
  min-height: 96rpx;
  transition: background-color 0.2s ease;
}

.setting-item:active {
  background-color: #f8f8f8;
}

.setting-item:last-child {
  border-bottom: none;
}

.item-left .item-label {
  font-family: PingFang SC;
  font-weight: 400;
  font-size: 28rpx;
  line-height: 100%;
  letter-spacing: 0px;
  color: #000;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-value {
  font-size: 30rpx;
  color: #999;
  max-width: 400rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.notice-preview {
  max-width: 320rpx;
}

.item-arrow {
  color: #c7c7cc;
  font-size: 28rpx;
  font-weight: normal;
  opacity: 0.6;
}

/* 群成员区域 */
.member-section {
  border-bottom: none !important;
  padding-bottom: 0;
}

/* 群类型和我的群昵称之间无间隙 */
.setting-item:not(.member-section):not(.group-type-item) {
  margin-bottom: 0;
}

/* 群类型和退出群聊之间增加间隙 */
.group-type-item {
  margin-bottom: 16rpx;
  /* 8px 间距 */
}

.member-section .item-right {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.member-count {
  font-size: 30rpx;
  color: #999;
}



/* 退出群聊区域 */
.exit-section {
  background: white;
  padding: 20rpx 0;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  margin-bottom: 40rpx;
  border: none;
  /* 移除边框 */
}

.exit-btn {
  width: 100%;
  padding: 32rpx 30rpx;
  background: transparent;
  border: none;
  color: #E54545;
  font-family: PingFang SC;
  font-weight: 400;
  font-size: 28rpx;
  /* 14px */
  line-height: 100%;
  letter-spacing: 0px;
  text-align: center;
  transition: background-color 0.2s ease;
}

.exit-btn:active {
  background-color: #f8f8f8;
}

/* 确认弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 60rpx 40rpx;
  backdrop-filter: blur(4rpx);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.confirm-modal {
  background: white;
  border-radius: 24rpx;
  width: 580rpx;
  max-width: 90vw;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(40rpx);
    opacity: 0;
  }

  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-content {
  padding: 64rpx 48rpx 48rpx;
  text-align: center;
}

.modal-title {
  display: block;
  font-size: 38rpx;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24rpx;
  line-height: 1.3;
}

.modal-desc {
  display: block;
  font-size: 32rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 48rpx;
}

.modal-buttons {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.modal-buttons button {
  flex: 1;
  padding: 32rpx 0;
  border: none;
  background: transparent;
  font-size: 34rpx;
  font-weight: 500;
  position: relative;
  line-height: 1;
  transition: all 0.2s ease;
}

.modal-buttons button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.05);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.modal-buttons button:active::after {
  opacity: 1;
}

.btn-cancel {
  color: #666;
  border-right: 1rpx solid #f0f0f0;
}

.btn-confirm {
  color: #007aff;
  font-weight: 600;
}

.btn-confirm.danger {
  color: #ff453a;
}

/* 编辑弹窗样式 */
.edit-modal {
  background: white;
  border-radius: 24rpx;
  width: 580rpx;
  max-width: 90vw;
  overflow: hidden;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

.edit-input {
  height: 100rpx;
  width: 100%;
  padding: 0 32rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 16rpx;
  font-size: 34rpx;
  margin: 32rpx 0;
  background: #fafafa;
  box-sizing: border-box;
  transition: all 0.3s ease;
  color: #333;
}

.edit-input:focus {
  border-color: #007aff;
  background: white;
  outline: none;
  box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.1);
}

.edit-textarea {
  width: 100%;
  min-height: 260rpx;
  padding: 32rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 16rpx;
  font-size: 34rpx;
  margin: 32rpx 0;
  background: #fafafa;
  resize: none;
  box-sizing: border-box;
  line-height: 1.6;
  transition: all 0.3s ease;
  color: #333;
}

.edit-textarea:focus {
  border-color: #007aff;
  background: white;
  outline: none;
  box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.1);
}

.notice-content {
  width: 100%;
  min-height: 260rpx;
  padding: 32rpx;
  border: 2rpx solid #f0f0f0;
  border-radius: 16rpx;
  font-size: 34rpx;
  margin: 32rpx 0;
  background: #f8f9fa;
  color: #666;
  line-height: 1.6;
  box-sizing: border-box;
  border-radius: 16rpx;
}

/* 响应式设计 */
@media (max-width: 375px) {
  .group-header {
    padding: 30rpx 20rpx;
  }

  .group-avatar {
    width: 100rpx;
    height: 100rpx;
  }

  .group-basic-info .group-name {
    font-size: 32rpx;
  }

  .setting-item {
    padding: 25rpx;
  }

  .item-left .item-label {
    font-size: 30rpx;
  }

  .item-value {
    font-size: 26rpx;
  }
}
</style>