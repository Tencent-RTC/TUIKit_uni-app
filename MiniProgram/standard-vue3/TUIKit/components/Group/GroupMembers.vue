<template>
  <view class="group-members">
    <!-- 群成员网格 -->
    <view class="members-grid">
      <!-- 群成员头像 -->
      <view 
        v-for="(member, index) in displayMembers" 
        :key="member.userID"
        class="member-item"
        @click="onMemberClick(member)"
      >
        <view class="member-avatar-container">
          <Avatar 
            :avatarStyle="avatarStyle" 
            :src="member.avatar || defaultAvatarIcon"
          />
          <!-- 群主标识 -->
          <view v-if="member.role === GroupMemberRole.OWNER" class="owner-badge">
            <text class="owner-text">群主</text>
          </view>
        </view>
        <text class="member-nick">{{ member.nameCard || member.nick || member.userID }}</text>
      </view>

      <!-- 添加成员按钮 -->
      <view v-if="!props.readonly" class="member-item add-member" @click="onAddMember">
        <view class="member-avatar-container">
          <view class="add-icon">+</view>
        </view>
      </view>

      <!-- 删除成员按钮 (仅群主可见) -->
      <view 
        v-if="!props.readonly && currentUserRole === GroupMemberRole.OWNER" 
        class="member-item remove-member" 
        @click="onRemoveMember"
      >
        <view class="member-avatar-container">
          <view class="remove-icon">−</view>
        </view>
      </view>
    </view>

    <!-- 折叠/展开按钮 -->
    <view 
      v-if="!props.readonly && totalMembers > displayLimit" 
      class="toggle-button"
      @click="toggleExpanded"
    >
      <text class="toggle-text">
        {{ isExpanded ? '收起' : `查看更多成员(${totalMembers - displayLimit})` }}
      </text>
      <text class="toggle-icon">{{ isExpanded ? '▲' : '▼' }}</text>
    </view>

    <!-- 添加成员弹窗 -->
    <view v-if="showAddMemberModal" class="modal-overlay" @click="showAddMemberModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">添加群成员</text>
          <text class="close-btn" @click="showAddMemberModal = false">×</text>
        </view>
        <view class="modal-body">
          <UserPicker 
            ref="userPickerRef"
            :maxCount="maxAddCount"
            :excludeUserIDs="currentMemberIDs"
            :inModal="true"
            @confirm="handleAddMembers"
          />
        </view>
      </view>
    </view>

    <!-- 删除成员弹窗 -->
    <view v-if="showRemoveMemberModal" class="modal-overlay" @click="showRemoveMemberModal = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">删除群成员</text>
          <text class="close-btn" @click="showRemoveMemberModal = false">×</text>
        </view>
        <view class="modal-body">
          <UserPicker 
            ref="removeUserPickerRef"
            :maxCount="maxRemoveCount"
            :dataSource="removableMembers"
            mode="remove"
            :enableDelete="false"
            :enableSearch="false"
            :inModal="true"
            @confirm="handleRemoveMembers"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { GroupMemberRole } from '../../states/GroupSettingState/types';
import { useGroupSettingState } from '../../states/GroupSettingState/GroupSettingState';
import Avatar from '../Avatar/Avatar.vue';
import UserPicker from '../UserPicker/UserPicker.vue';
import defaultAvatarIcon from '../../assets/base/default-avatar.png';

interface GroupMember {
  userID: string;
  nick?: string;
  avatar?: string;
  role?: string;
  nameCard?: string;
}

interface Props {
  displayLimit?: number;
  maxAddCount?: number;
  maxRemoveCount?: number;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  displayLimit: 12,
  maxAddCount: 50,
  maxRemoveCount: 50,
  readonly: false
});

const emit = defineEmits<{
  memberClick: [member: GroupMember];
  addMembers: [userIDs: string[]];
  removeMembers: [userIDs: string[]];
}>();

const {
  allMembers,
  currentUserRole,
} = useGroupSettingState();

const isExpanded = ref(false);
const showAddMemberModal = ref(false);
const showRemoveMemberModal = ref(false);
const userPickerRef = ref();
const removeUserPickerRef = ref();

const avatarStyle = {
  width: '100%',
  height: '100%'
};


const totalMembers = computed(() => allMembers.value?.length || 0);

const displayMembers = computed(() => {
  const members = allMembers.value || [];
  if (props.readonly || isExpanded.value) {
    return members;
  }
  return members.slice(0, props.displayLimit);
});

const removableMembers = computed(() => {
  // 过滤掉群主
  return allMembers.value?.filter(member => member.role !== GroupMemberRole.OWNER) || [];
});

const currentMemberIDs = computed(() => {
  return allMembers.value?.map(member => member.userID) || [];
});

const onMemberClick = (member: GroupMember) => {
  emit('memberClick', member);
};

const onAddMember = () => {
  showAddMemberModal.value = true;
};

const onRemoveMember = () => {
  if (currentUserRole.value !== GroupMemberRole.OWNER) {
    uni.showToast({
      title: '只有群主可以删除成员',
      icon: 'none'
    });
    return;
  }
  showRemoveMemberModal.value = true;
};

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const handleAddMembers = async (userIDs: string[]) => {
  try {
    await emit('addMembers', userIDs);
    showAddMemberModal.value = false;
    uni.showToast({
      title: '添加成员成功',
      icon: 'success'
    });
  } catch (error) {
    console.error('添加成员失败:', error);
    uni.showToast({
      title: '添加成员失败',
      icon: 'none'
    });
  }
};

const handleRemoveMembers = async (userIDs: string[]) => {
  try {
    await emit('removeMembers', userIDs);
    showRemoveMemberModal.value = false;
    uni.showToast({
      title: '删除成员成功',
      icon: 'success'
    });
  } catch (error) {
    console.error('删除成员失败:', error);
    uni.showToast({
      title: '删除成员失败',
      icon: 'none'
    });
  }
};
</script>

<style lang="scss" scoped>
.group-members {
  background: white;
  padding: 0 30rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.members-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.member-item {
  width: calc((100% - 100rpx) / 6); // 6列布局
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.member-avatar-container {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
  margin-bottom: 12rpx;
}

.add-member .member-avatar-container,
.remove-member .member-avatar-container {
  overflow: visible;
}

.add-icon,
.remove-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: 300;
  line-height: 1;
  border-radius: 50%;
  background: #f8f9fa;
  color: #999;
  transition: all 0.2s ease;
}

.add-icon {
  color: #07c160;
  background: rgba(7, 193, 96, 0.08);
}

.add-icon:active {
  background: rgba(7, 193, 96, 0.15);
  transform: scale(0.95);
}

.remove-icon {
  color: #fa5151;
  background: rgba(250, 81, 81, 0.08);
}

.remove-icon:active {
  background: rgba(250, 81, 81, 0.15);
  transform: scale(0.95);
}

.owner-badge {
  position: absolute;
  bottom: 0rpx;
  left: 50%;
  transform: translateX(-50%);
  background: #ff9500;
  color: white;
  font-size: 18rpx;
  padding: 2rpx 6rpx;
  border-radius: 6rpx;
  white-space: nowrap;
  z-index: 10;
  line-height: 1;
}

.owner-text {
  font-size: 18rpx;
  line-height: 1;
}

.member-nick {
  font-size: 24rpx;
  color: #333;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 20rpx;
  margin-top: 10rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
  transition: background-color 0.2s;
}

.toggle-button:active {
  background: #e9ecef;
}

.toggle-text {
  font-size: 28rpx;
  color: #666;
}

.toggle-icon {
  font-size: 24rpx;
  color: #999;
}

/* 弹窗样式 */
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
  z-index: 1000;
}

.modal-content {
  width: 95vw;
  max-width: 900rpx;
  height: 90vh;
  max-height: 950rpx;
  background: white;
  border-radius: 24rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  flex-shrink: 0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #999;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}






</style>