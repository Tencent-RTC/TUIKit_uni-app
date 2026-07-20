<template>
  <view class="user-picker">
    <!-- 搜索栏 -->
    <view v-if="enableSearch" class="search-bar">
      <view class="search-input-container">
        <input class="search-input" :placeholder="searchPlaceholder" v-model="searchKeyword" @confirm="handleSearch" />
        <view class="search-icon" @click="handleSearch">🔍</view>
      </view>
    </view>

    <!-- 用户列表区域 -->
    <view class="list-container">
      <scroll-view class="user-list" scroll-y :style="listStyle">
        <!-- 空状态 -->
        <view v-if="allUsers.length === 0" class="empty-state">
          <text class="empty-text">{{ emptyText }}</text>
        </view>

        <!-- 已搜索到的用户列表 -->
        <view v-for="user in allUsers" :key="user.userID" class="user-item" @click="toggleUserSelection(user)">
          <view v-if="!readOnly" class="checkbox">
            <view class="checkbox-icon" :class="{ 'checked': selectedUsers.has(user.userID) }">
              <text v-if="selectedUsers.has(user.userID)" class="checkmark">✓</text>
            </view>
          </view>

          <!-- 用户头像 -->
          <view class="user-avatar">
            <image :src="user.avatar || defaultAvatarIcon" class="avatar-img" />
          </view>

          <!-- 用户信息 -->
          <view class="user-info">
            <text class="user-nick">{{ user.nick || user.userID }}</text>
            <text class="user-id">{{ user.userID }}</text>
          </view>

          <!-- 删除按钮 -->
          <view v-if="enableDelete" class="delete-btn" @click.stop="removeUser(user.userID)">
            <text>×</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 底部操作栏-->
    <view v-if="!readOnly" class="bottom-bar">
      <view class="selected-count">
        已选 {{ selectedUsers.size }} 人
      </view>
      <button class="confirm-btn" :class="{ 'disabled': selectedUsers.size === 0 }" @click="handleConfirm"
        :disabled="selectedUsers.size === 0">
        确定
      </button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import TUIChatEngine from '../../states/chat-uikit-engine-lite';
import defaultAvatarIcon from '../../assets/base/default-avatar.png';

interface User {
  userID: string
  nick?: string
  avatar?: string
}

interface Props {
  maxCount?: number
  readOnly?: boolean
  enableSearch?: boolean
  enableDelete?: boolean
  dataSource?: User[]
  excludeUserIDs?: string[]
  mode?: 'select' | 'remove' // 模式：select-选择模式（排除指定用户），remove-删除模式（显示所有用户）
  inModal?: boolean // 是否在弹窗中使用
}

const emit = defineEmits<{
  confirm: [selectedUserIDs: string[]]
}>()

const props = withDefaults(defineProps<Props>(), {
  maxCount: Number.POSITIVE_INFINITY,
  readOnly: false,
  enableSearch: true,
  enableDelete: true,
  dataSource: [],
  excludeUserIDs: () => [],
  mode: 'select',
  inModal: false
})

const searchKeyword = ref('')
const allUsers = ref<User[]>([])
const selectedUsers = reactive(new Set<string>())

// 根据模式决定是否应用排除逻辑
const shouldApplyExclude = computed(() => props.mode === 'select')

const listStyle = computed(() => {
  if (props.inModal) {
    // 在弹窗中：使用 calc 计算可用高度，避免大片空白
    return {
      height: 'calc(90vh - 160rpx - 120rpx)' // 90vh - 搜索栏(160rpx) - 底部操作栏(120rpx)
    }
  } else {
    // 全屏模式：使用整个视口高度
    return {
      height: 'calc(100vh - 128rpx - 120rpx)' // 减去搜索栏(128rpx)和底部操作栏(120rpx)的高度
    }
  }
})

const searchPlaceholder = computed(() => {
  if (props.mode === 'remove') {
    return '搜索群成员昵称或ID'
  }
  return props.dataSource.length > 0 ? '搜索群成员昵称或ID' : '输入用户ID进行搜索添加'
})

const emptyText = computed(() => {
  if (props.mode === 'remove') {
    return '暂无群成员'
  }
  return props.dataSource.length > 0 ? '暂无群成员' : '暂无用户，请搜索添加'
})

onMounted(() => {
  allUsers.value = shouldApplyExclude.value 
    ? props.dataSource?.filter(user => !props.excludeUserIDs.includes(user.userID))
    : [...props.dataSource]
})

// 监听 dataSource 变化
watch(() => props.dataSource, (newDataSource) => {
  allUsers.value = shouldApplyExclude.value 
    ? newDataSource.filter(user => !props.excludeUserIDs.includes(user.userID))
    : [...newDataSource]
}, { deep: true })

// 监听 excludeUserIDs 变化
watch(() => props.excludeUserIDs, () => {
  allUsers.value = shouldApplyExclude.value 
    ? props.dataSource.filter(user => !props.excludeUserIDs.includes(user.userID))
    : [...props.dataSource]
}, { deep: true })

// 监听 mode 变化
watch(() => props.mode, () => {
  allUsers.value = shouldApplyExclude.value 
    ? props.dataSource.filter(user => !props.excludeUserIDs.includes(user.userID))
    : [...props.dataSource]
}, { deep: true })

const searchUsers = async (keyword: string): Promise<User[]> => {
  if (!keyword.trim()) {
    // 如果没有关键词，根据模式返回相应的数据源
    return shouldApplyExclude.value 
      ? props.dataSource.filter(user => !props.excludeUserIDs.includes(user.userID))
      : [...props.dataSource]
  }

  // 如果有dataSource，在dataSource中搜索
  if (props.dataSource.length > 0) {
    const filteredUsers = props.dataSource.filter(user => {
      const matchesKeyword = user.userID.includes(keyword) || 
        (user.nick && user.nick.includes(keyword))
      
      // 根据模式决定是否应用排除逻辑
      return shouldApplyExclude.value 
        ? !props.excludeUserIDs.includes(user.userID) && matchesKeyword
        : matchesKeyword
    })

    if (filteredUsers.length === 0) {
      uni.showToast({
        title: '未找到匹配的群成员',
        icon: 'none'
      })
    }

    return filteredUsers
  } else {
    // 如果没有dataSource，进行全局搜索
    const currentUserID = TUIChatEngine.getMyUserID();
    
    // 在选择模式下，检查是否搜索自己或排除列表中的用户
    if (shouldApplyExclude.value && (keyword === currentUserID || props.excludeUserIDs.includes(keyword))) {
      uni.showToast({
        title: keyword === currentUserID ? '不能搜索自己' : '用户已在群中',
        icon: 'none'
      })
      return []
    }
    
    // 在删除模式下，只检查是否搜索自己
    if (!shouldApplyExclude.value && keyword === currentUserID) {
      uni.showToast({
        title: '不能删除自己',
        icon: 'none'
      })
      return []
    }

    try {
      const res = await TUIChatEngine.TUIUser.getUserProfile({ userIDList: [keyword] })

      if (res.data.length > 0) {
        const { nick = '', avatar = '' } = res.data[0]
        return [
          {
            userID: keyword,
            nick,
            avatar: avatar || defaultAvatarIcon
          }
        ]
      } else {
        uni.showToast({
          title: '用户不存在',
          icon: 'none'
        })
        return []
      }
    } catch (error) {
      console.error('搜索用户失败:', error)
      uni.showToast({
        title: '搜索失败',
        icon: 'none'
      })
      return []
    }
  }
}

const handleSearch = async () => {
  const keyword = searchKeyword.value.trim()
  
  try {
    const results = await searchUsers(keyword)
    
    if (props.dataSource.length > 0) {
      // 有dataSource时，直接显示搜索结果（过滤模式）
      allUsers.value = results
    } else {
      // 无dataSource时，添加模式
      if (results.length > 0) {
        // 检查是否已经存在该用户
        const existingUser = allUsers.value.find(user => user.userID === keyword)
        if (!existingUser) {
          // 将新用户添加到现有列表中
          allUsers.value = [...allUsers.value, ...results]
        } else {
          uni.showToast({
            title: '用户已存在',
            icon: 'none'
          })
        }
      }
    }
    
    // 搜索完成后清除输入框内容
    searchKeyword.value = ''
  } catch (error) {
    console.error('搜索用户失败:', error)
  }
}



const toggleUserSelection = (user: User) => {
  if (props.readOnly) return

  if (selectedUsers.has(user.userID)) {
    selectedUsers.delete(user.userID)
  } else {
    if (selectedUsers.size >= props.maxCount) {
      uni.showToast({
        title: `最多只能选择 ${props.maxCount} 个用户`,
        icon: 'none'
      })
      return
    }

    if (props.maxCount === 1) {
      selectedUsers.clear()
    }
    selectedUsers.add(user.userID)
  }
}

const removeUser = (userID: string) => {
  allUsers.value = allUsers.value.filter(user => user.userID !== userID)
  if (selectedUsers.has(userID)) {
    selectedUsers.delete(userID)
  }
}

const handleConfirm = async () => {
  if (selectedUsers.size === 0) return

  const selectedUserIDs = Array.from(selectedUsers)
  emit('confirm', selectedUserIDs)
}

defineExpose({
  handleConfirm
})
</script>

<style lang="scss" scoped>
.user-picker {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.user-picker[in-modal="true"] {
  height: 90vh;
  max-height: 800px;
}

.search-bar {
  padding: 24rpx;
  background-color: #fff;
  border-bottom: 1rpx solid #e8e8e8;
  flex-shrink: 0;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  height: 80rpx;
  padding: 0 80rpx 0 30rpx;
  background-color: #f0f2f7;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: 1rpx solid #e0e0e0;
}

.search-icon {
  position: absolute;
  right: 30rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  cursor: pointer;
}

.list-container {
  flex: 1;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.user-list {
  width: 100%;
  background-color: #fff;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
  position: relative;
  transition: background-color 0.2s;
}

.user-item:active {
  background-color: #f8f9fa;
}

.checkbox {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.checkbox-icon {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #dcdfe6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.checked {
    border-color: #07c160;
    background-color: #07c160;
  }
}

.checkmark {
  color: #fff;
  font-size: 20rpx;
  font-weight: bold;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20rpx;
  background-color: #f0f2f5;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-nick {
  font-size: 32rpx;
  color: #1a1a1a;
  font-weight: 500;
  margin-bottom: 8rpx;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 400rpx;
}

.user-id {
  font-size: 24rpx;
  color: #8c8c8c;
  line-height: 1.2;
}

.delete-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 36rpx;
  font-weight: bold;
  border-radius: 50%;
  transition: all 0.2s;
}

.delete-btn:active {
  background-color: #ffebee;
  color: #ff4444;
}

.bottom-bar {
  height: 120rpx;
  background-color: #fff;
  border-top: 1rpx solid #e8e8e8;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.selected-count {
  font-size: 28rpx;
  color: #666;
  flex: 1;
}

.confirm-btn {
  background-color: #07c160;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  height: 72rpx;
  padding: 0 40rpx;
  transition: all 0.2s;

  &.disabled {
    background-color: #dcdfe6;
    color: #c0c4cc;
  }
}

.confirm-btn:not(.disabled):active {
  background-color: #06a854;
  transform: scale(0.98);
}

/* 群聊表单弹出层样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-height: 80vh;
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
  box-sizing: border-box;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 30rpx 24rpx;
  border-bottom: 1rpx solid #e8e8e8;
  position: relative;
  box-sizing: border-box;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
  text-align: center;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #999;
  position: absolute;
  right: 30rpx;
}

.form-container {
  flex: 1;
  max-height: 60vh;
  padding: 30rpx;
  box-sizing: border-box;
  overflow: hidden;
}

.form-item {
  margin-bottom: 32rpx;
  box-sizing: border-box;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #1a1a1a;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  background-color: #f8f9fa;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-picker {
  width: 100%;
  height: 80rpx;
  background-color: #f8f9fa;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  box-sizing: border-box;
  cursor: pointer;
}

.picker-value {
  font-size: 28rpx;
  color: #1a1a1a;
  width: 100vw;
  height: 100%;
  display: flex;
  align-items: center;
}

.form-textarea {
  width: 100%;
  min-height: 160rpx;
  padding: 24rpx;
  background-color: #f8f9fa;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  line-height: 1.5;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 30rpx 40rpx;
  border-top: 1rpx solid #e8e8e8;
  box-sizing: border-box;
}

.cancel-btn {
  flex: 1;
  height: 80rpx;
  background-color: #f8f9fa;
  color: #666;
  border: 1rpx solid #e8e8e8;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.submit-btn {
  flex: 1;
  height: 80rpx;
  background-color: #07c160;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.cancel-btn:active {
  background-color: #e8e8e8;
}

.submit-btn:active {
  background-color: #06a854;
}
</style>